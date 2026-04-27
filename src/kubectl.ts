import { parse as parseYaml } from "yaml";
import type { ClusterSnapshot, GpuMetric, K8sNode, MigProfile, NodeList, NodeView } from "./types";

const gpuOperatorNamespace = process.env.GPU_OPERATOR_NAMESPACE ?? "gpu-operator";
const dcgmService = process.env.DCGM_EXPORTER_SERVICE ?? "nvidia-dcgm-exporter";

type ExecResult = {
  stdout: string;
  stderr: string;
};

export async function kubectl(args: string[], timeoutMs = 15_000): Promise<ExecResult> {
  const process = Bun.spawn(["kubectl", ...args], {
    stdout: "pipe",
    stderr: "pipe"
  });

  const timeout = setTimeout(() => {
    process.kill();
  }, timeoutMs);

  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
      process.exited
    ]);

    if (exitCode !== 0) {
      throw new Error(stderr.trim() || `kubectl ${args.join(" ")} exited with ${exitCode}`);
    }

    return { stdout, stderr };
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadSnapshot(): Promise<ClusterSnapshot> {
  try {
    const [{ stdout: nodesJson }, metrics] = await Promise.all([
      kubectl(["get", "nodes", "-o", "json"]),
      loadDcgmMetrics()
    ]);
    const nodeList = JSON.parse(nodesJson) as NodeList;
    const nodes = await Promise.all(nodeList.items.map((node) => toNodeView(node, metrics)));

    return {
      nodes,
      fetchedAt: new Date()
    };
  } catch (error) {
    return {
      nodes: [],
      fetchedAt: new Date(),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function applyMigProfile(nodeName: string, profileName: string): Promise<void> {
  await kubectl(["label", "node", nodeName, `nvidia.com/mig.config=${profileName}`, "--overwrite"], 30_000);
}

async function toNodeView(node: K8sNode, allMetrics: GpuMetric[]): Promise<NodeView> {
  const labels = node.metadata.labels ?? {};
  const allocatable = node.status?.allocatable ?? {};
  const capacity = node.status?.capacity ?? {};
  const name = node.metadata.name;
  const gpuResource = Number(
    allocatable["nvidia.com/gpu"] ?? capacity["nvidia.com/gpu"] ?? labels["nvidia.com/gpu.count"] ?? 0
  );
  const hasGpu = labels["nvidia.com/gpu.present"] === "true" || gpuResource > 0;
  const profiles = hasGpu ? await loadMigProfiles(name, allocatable, capacity) : [];

  return {
    name,
    ready:
      node.status?.conditions?.some((condition) => condition.type === "Ready" && condition.status === "True") ?? false,
    hasGpu,
    migCapable: labels["nvidia.com/mig.capable"] === "true",
    gpuProduct: labels["nvidia.com/gpu.product"]?.replaceAll("-", " "),
    gpuCount: gpuResource,
    migConfig: labels["nvidia.com/mig.config"],
    migState: labels["nvidia.com/mig.config.state"],
    labels,
    allocatable,
    capacity,
    profiles,
    metrics: allMetrics.filter((metric) => metric.hostname === name)
  };
}

async function loadMigProfiles(
  nodeName: string,
  allocatable: Record<string, string>,
  capacity: Record<string, string>
): Promise<MigProfile[]> {
  const fromConfigMap = await loadProfilesFromConfigMap(nodeName);
  if (fromConfigMap.length > 0) {
    return fromConfigMap;
  }

  const profileNames = new Set<string>();
  for (const key of [...Object.keys(allocatable), ...Object.keys(capacity)]) {
    const match = /^nvidia\.com\/mig-(.+)$/.exec(key);
    if (match?.[1]) {
      profileNames.add(`all-${match[1]}`);
    }
  }

  const fromResources = [...profileNames].sort(sortProfiles).map<MigProfile>((name) => ({
    name,
    enabled: true,
    devices: { [name.replace(/^all-/, "")]: Number(capacity[`nvidia.com/mig-${name.replace(/^all-/, "")}`] ?? 0) },
    source: "resources"
  }));

  return [
    ...fromResources,
    { name: "all-disabled", enabled: false, devices: {}, source: "fallback" },
    { name: "all-enabled", enabled: true, devices: {}, source: "fallback" }
  ];
}

async function loadProfilesFromConfigMap(nodeName: string): Promise<MigProfile[]> {
  try {
    const { stdout } = await kubectl([
      "get",
      "cm",
      "-n",
      gpuOperatorNamespace,
      `${nodeName}-mig-config`,
      "-o",
      "jsonpath={.data.config\\.yaml}"
    ]);
    const parsed = parseYaml(stdout) as {
      "mig-configs"?: Record<string, Array<{ "mig-enabled"?: boolean; "mig-devices"?: Record<string, number> }>>;
    };

    return Object.entries(parsed["mig-configs"] ?? {})
      .map<MigProfile>(([name, entries]) => {
        const first = entries[0];

        return {
          name,
          enabled: first?.["mig-enabled"] ?? !name.includes("disabled"),
          devices: first?.["mig-devices"] ?? {},
          source: "configmap"
        };
      })
      .sort((left, right) => sortProfiles(left.name, right.name));
  } catch {
    return [];
  }
}

async function loadDcgmMetrics(): Promise<GpuMetric[]> {
  try {
    const { stdout } = await kubectl([
      "get",
      "--raw",
      `/api/v1/namespaces/${gpuOperatorNamespace}/services/${dcgmService}:9400/proxy/metrics`
    ]);

    return parseDcgmMetrics(stdout);
  } catch {
    return [];
  }
}

function parseDcgmMetrics(metricsText: string): GpuMetric[] {
  const byKey = new Map<string, GpuMetric>();
  const wanted = new Set([
    "DCGM_FI_DEV_GPU_UTIL",
    "DCGM_FI_DEV_MEM_COPY_UTIL",
    "DCGM_FI_DEV_FB_USED",
    "DCGM_FI_DEV_FB_FREE",
    "DCGM_FI_DEV_POWER_USAGE",
    "DCGM_FI_DEV_GPU_TEMP",
    "DCGM_FI_PROF_GR_ENGINE_ACTIVE",
    "DCGM_FI_PROF_DRAM_ACTIVE"
  ]);

  for (const line of metricsText.split("\n")) {
    if (line.startsWith("#") || line.trim() === "") {
      continue;
    }

    const match = /^([A-Z0-9_]+)\{([^}]*)}\s+(-?\d+(?:\.\d+)?)/.exec(line);
    const metricName = match?.[1];
    const rawLabels = match?.[2];
    const rawValue = match?.[3];
    if (!metricName || !rawLabels || !rawValue || !wanted.has(metricName)) {
      continue;
    }

    const labels = parseMetricLabels(rawLabels);
    const hostname = labels.Hostname;
    const gpu = labels.gpu;
    if (!hostname || !gpu) {
      continue;
    }

    const migInstanceId = labels.GPU_I_ID;
    const key = `${hostname}:${labels.UUID ?? gpu}:${migInstanceId ?? "full"}`;
    const existing = byKey.get(key) ?? {
      hostname,
      gpu,
      uuid: labels.UUID,
      modelName: labels.modelName,
      migProfile: labels.GPU_I_PROFILE,
      migInstanceId,
      gpuUtil: undefined,
      memUtil: undefined,
      fbUsedMiB: undefined,
      fbFreeMiB: undefined,
      powerW: undefined,
      gpuTempC: undefined
    };
    const value = Number(rawValue);

    if (metricName === "DCGM_FI_DEV_GPU_UTIL") existing.gpuUtil = value;
    if (metricName === "DCGM_FI_DEV_MEM_COPY_UTIL") existing.memUtil = value;
    if (metricName === "DCGM_FI_PROF_GR_ENGINE_ACTIVE" && existing.gpuUtil === undefined)
      existing.gpuUtil = value * 100;
    if (metricName === "DCGM_FI_PROF_DRAM_ACTIVE" && existing.memUtil === undefined) existing.memUtil = value * 100;
    if (metricName === "DCGM_FI_DEV_FB_USED") existing.fbUsedMiB = value;
    if (metricName === "DCGM_FI_DEV_FB_FREE") existing.fbFreeMiB = value;
    if (metricName === "DCGM_FI_DEV_POWER_USAGE") existing.powerW = value;
    if (metricName === "DCGM_FI_DEV_GPU_TEMP") existing.gpuTempC = value;

    byKey.set(key, existing);
  }

  return [...byKey.values()].sort(
    (left, right) =>
      left.hostname.localeCompare(right.hostname) ||
      left.gpu.localeCompare(right.gpu, undefined, { numeric: true }) ||
      (left.migInstanceId ?? "").localeCompare(right.migInstanceId ?? "", undefined, { numeric: true })
  );
}

function parseMetricLabels(rawLabels: string): Record<string, string> {
  const labels: Record<string, string> = {};
  const labelPattern = /([A-Za-z0-9_]+)="((?:\\"|[^"])*)"/g;
  for (const match of rawLabels.matchAll(labelPattern)) {
    const key = match[1];
    const value = match[2];
    if (key && value !== undefined) {
      labels[key] = value.replaceAll('\\"', '"');
    }
  }

  return labels;
}

function sortProfiles(left: string, right: string): number {
  const priority = (name: string): number => {
    if (name === "all-disabled") return 0;
    if (name === "all-enabled") return 1;
    if (name === "all-balanced") return 2;
    return 10;
  };

  return priority(left) - priority(right) || left.localeCompare(right, undefined, { numeric: true });
}

export type NodeCondition = {
  type?: string;
  status?: string;
  reason?: string;
  message?: string;
};

export type K8sNode = {
  metadata: {
    name: string;
    labels?: Record<string, string>;
  };
  status?: {
    allocatable?: Record<string, string>;
    capacity?: Record<string, string>;
    conditions?: NodeCondition[];
  };
};

export type NodeList = {
  items: K8sNode[];
};

export type MigProfile = {
  name: string;
  enabled: boolean;
  devices: Record<string, number>;
  source: "configmap" | "resources" | "fallback";
};

export type GpuMetric = {
  hostname: string;
  gpu: string;
  uuid: string | undefined;
  modelName: string | undefined;
  migProfile: string | undefined;
  migInstanceId: string | undefined;
  gpuUtil: number | undefined;
  memUtil: number | undefined;
  fbUsedMiB: number | undefined;
  fbFreeMiB: number | undefined;
  powerW: number | undefined;
  gpuTempC: number | undefined;
};

export type NodeView = {
  name: string;
  ready: boolean;
  hasGpu: boolean;
  migCapable: boolean;
  gpuProduct: string | undefined;
  gpuCount: number;
  migConfig: string | undefined;
  migState: string | undefined;
  labels: Record<string, string>;
  allocatable: Record<string, string>;
  capacity: Record<string, string>;
  profiles: MigProfile[];
  metrics: GpuMetric[];
};

export type ClusterSnapshot = {
  nodes: NodeView[];
  fetchedAt: Date;
  error?: string;
};

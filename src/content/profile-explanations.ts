import type { MigProfile } from "../types";

export type ProfileExplanation = {
  kind: string;
  meaning: string;
  bestFor: string;
  layout: string;
  resources: string;
};

export function describeDevices(profile: MigProfile): string {
  const devices = Object.entries(profile.devices)
    .map(([name, count]) => `${count} x ${name}`)
    .join(", ");

  if (devices) return devices;
  return profile.enabled ? "MIG mode enabled, no fixed slice layout" : "MIG disabled, expose full GPU";
}

export function describeResources(profile: MigProfile): string {
  const resources = Object.keys(profile.devices)
    .map((name) => `nvidia.com/mig-${name.replace("+me", "")}`)
    .join(", ");

  if (resources) return resources;
  return profile.enabled ? "no fixed MIG resource until slices exist" : "nvidia.com/gpu";
}

export function explainProfile(profile: MigProfile): ProfileExplanation {
  const resources = describeResources(profile);
  const layout = describeDevices(profile);

  if (!profile.enabled) {
    return {
      kind: "MIG disabled",
      meaning: "Turns MIG off and exposes the whole physical GPU.",
      bestFor: "single large jobs that need the full H100.",
      layout,
      resources
    };
  }

  if (Object.keys(profile.devices).length === 0) {
    return {
      kind: "MIG mode only",
      meaning: "Enables MIG without creating schedulable slices.",
      bestFor: "advanced setup before another tool creates instances.",
      layout,
      resources
    };
  }

  if (profile.name === "all-balanced") {
    return {
      kind: "balanced mixed layout",
      meaning: "Creates a mix of small, medium, and large MIG instances.",
      bestFor: "shared clusters with varied workload sizes.",
      layout,
      resources
    };
  }

  if (profile.name.endsWith(".me") || Object.keys(profile.devices).some((name) => name.includes("+me"))) {
    return {
      kind: "media-extension profile",
      meaning: "+me reserves a MIG instance with media engines enabled.",
      bestFor: "video encode/decode or media-heavy workloads.",
      layout,
      resources
    };
  }

  return {
    kind: "uniform MIG layout",
    meaning: "Splits the GPU into identical MIG instances of one profile size.",
    bestFor: "many similar jobs with predictable GPU memory needs.",
    layout,
    resources
  };
}

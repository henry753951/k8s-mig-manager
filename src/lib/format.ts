export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function compactGpuName(value: string | undefined): string {
  if (!value) return "unknown";
  return value.replace(/^NVIDIA /, "").replace(/\s+/g, " ");
}

export function fit(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3)}...`;
}

export function formatMiB(value: number | undefined): string {
  return value === undefined ? "n/a" : `${value.toFixed(0)}MiB`;
}

export function formatUnit(value: number | undefined, unit: string): string {
  return value === undefined ? "n/a" : `${value.toFixed(unit === "W" ? 1 : 0)}${unit}`;
}

export function metricColor(value: number): string {
  if (value >= 85) return "red";
  if (value >= 65) return "yellow";
  return "green";
}

export function wrap(value: number, length: number): number {
  return ((value % length) + length) % length;
}

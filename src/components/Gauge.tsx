import { Text } from "ink";
import { clamp } from "../lib/format";

export function Gauge({
  label,
  value,
  width,
  color
}: {
  label: string;
  value: number | undefined;
  width: number;
  color: string;
}) {
  const percent = clamp(value ?? 0, 0, 100);
  const filled = Math.round((percent / 100) * width);

  return (
    <Text>
      <Text dimColor>{label.padEnd(6)} </Text>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(width - filled)}</Text>
      <Text> {value === undefined ? "n/a" : `${percent.toFixed(label === "memory" ? 1 : 0)}%`}</Text>
    </Text>
  );
}

export function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <Text>
      <Text dimColor>{label} </Text>
      <Text color="white">{value}</Text>
    </Text>
  );
}

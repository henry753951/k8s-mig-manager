import { Box, Text } from "ink";
import { fit, formatMiB, formatUnit, metricColor } from "../lib/format";
import type { GpuMetric, NodeView } from "../types";
import { Gauge, MetricBadge } from "./Gauge";

const accentColors = ["cyan", "magenta", "green", "yellow", "blue"] as const;

export function MetricsPanel({
  node,
  width = 58,
  minHeight
}: {
  node: NodeView | undefined;
  width?: number;
  minHeight?: number;
}) {
  if (!node?.hasGpu) {
    return (
      <Box
        flexDirection="column"
        width={width}
        minHeight={minHeight}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text bold>Live GPU Metrics</Text>
        <Text dimColor>No GPU metrics for selected node.</Text>
      </Box>
    );
  }

  if (node.metrics.length === 0) {
    return (
      <Box
        flexDirection="column"
        width={width}
        minHeight={minHeight}
        borderStyle="single"
        borderColor="yellow"
        paddingX={1}
      >
        <Text bold>Live GPU Metrics</Text>
        <Text color="yellow">No DCGM metrics found for {node.name}.</Text>
      </Box>
    );
  }

  const cardWidth = width >= 104 ? Math.floor((width - 6) / 2) : width - 4;
  const columns = chunk(node.metrics, width >= 104 ? 2 : 1);
  const totalUsed = node.metrics.reduce((sum, metric) => sum + (metric.fbUsedMiB ?? 0), 0);
  const totalFree = node.metrics.reduce((sum, metric) => sum + (metric.fbFreeMiB ?? 0), 0);
  const avgUtil = average(node.metrics.map((metric) => metric.gpuUtil));
  const hottest = Math.max(...node.metrics.map((metric) => metric.gpuTempC ?? 0));

  return (
    <Box
      flexDirection="column"
      width={width}
      minHeight={minHeight}
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          Live GPU Metrics
        </Text>
        <Text>
          <Text color="magenta">{node.metrics.length}</Text>
          <Text dimColor> devices</Text>
        </Text>
      </Box>
      <Box marginTop={1} gap={2}>
        <SummaryBadge label="avg util" value={avgUtil === undefined ? "n/a" : `${avgUtil.toFixed(0)}%`} color="green" />
        <SummaryBadge
          label="fb used"
          value={`${formatMiB(totalUsed)}/${formatMiB(totalUsed + totalFree)}`}
          color="cyan"
        />
        <SummaryBadge label="hottest" value={formatUnit(hottest, "C")} color={hottest >= 80 ? "red" : "yellow"} />
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {columns.map((row, rowIndex) => (
          <Box key={row.map(metricKey).join(":")} gap={2} marginTop={rowIndex === 0 ? 0 : 1}>
            {row.map((metric, metricIndex) => (
              <MetricCard
                key={metricKey(metric)}
                metric={metric}
                width={cardWidth}
                accent={accentColors[(rowIndex * 2 + metricIndex) % accentColors.length] ?? "cyan"}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function MetricCard({ metric, width, accent }: { metric: GpuMetric; width: number; accent: string }) {
  const memTotal = (metric.fbUsedMiB ?? 0) + (metric.fbFreeMiB ?? 0);
  const memPercent = memTotal > 0 ? ((metric.fbUsedMiB ?? 0) / memTotal) * 100 : undefined;
  const gpuUtil = metric.gpuUtil ?? 0;
  const title =
    metric.migInstanceId === undefined
      ? `GPU ${metric.gpu}`
      : `MIG ${metric.migInstanceId} ${metric.migProfile ?? "unknown"}`;
  const gaugeWidth = Math.max(12, Math.min(24, width - 20));

  return (
    <Box flexDirection="column" width={width} borderStyle="round" borderColor={accent} paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color={accent}>
          {fit(title, Math.max(12, width - 22))}
        </Text>
        <Text color={metricColor(gpuUtil)}>{`${gpuUtil.toFixed(0)}%`}</Text>
      </Box>
      <Text dimColor>{fit(metric.modelName ?? "unknown", Math.max(12, width - 4))}</Text>
      <Gauge label="util" value={gpuUtil} width={gaugeWidth} color={metricColor(gpuUtil)} />
      <Gauge label="memory" value={memPercent} width={gaugeWidth} color={metricColor(memPercent ?? 0)} />
      <Box gap={2}>
        <MetricBadge label="fb" value={`${formatMiB(metric.fbUsedMiB)}/${formatMiB(memTotal)}`} />
        <MetricBadge label="temp" value={formatUnit(metric.gpuTempC, "C")} />
      </Box>
      <MetricBadge label="power" value={formatUnit(metric.powerW, "W")} />
    </Box>
  );
}

function SummaryBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Text>
      <Text backgroundColor={color} color="black">
        {` ${label} `}
      </Text>
      <Text> {value}</Text>
    </Text>
  );
}

function metricKey(metric: GpuMetric): string {
  return `${metric.hostname}:${metric.uuid ?? metric.gpu}:${metric.migInstanceId ?? "full"}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

function average(values: Array<number | undefined>): number | undefined {
  const present = values.filter((value): value is number => value !== undefined);
  if (present.length === 0) return undefined;

  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

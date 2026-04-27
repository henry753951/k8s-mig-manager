import { Box, Text } from "ink";
import type { ClusterSnapshot, NodeView } from "../types";

const refreshMs = Number(process.env.REFRESH_MS ?? 3000);

export type AppView = "nodes" | "node";
export type NodeTab = "profiles" | "metrics";

export function Header({
  snapshot,
  status,
  busy,
  view,
  selectedNode
}: {
  snapshot: ClusterSnapshot;
  status: string;
  busy: boolean;
  view: AppView;
  selectedNode: NodeView | undefined;
}) {
  const gpuNodes = snapshot.nodes.filter((node) => node.hasGpu).length;
  const location = view === "node" && selectedNode ? `cluster / ${selectedNode.name}` : "cluster";

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        <Text bold color="cyan">
          K8s MIG Manager
        </Text>
        <Text dimColor> </Text>
        <Text color="green">{gpuNodes}</Text>/<Text>{snapshot.nodes.length}</Text>
        <Text dimColor> GPU nodes refresh </Text>
        <Text>{refreshMs / 1000}s</Text>
        <Text dimColor> path </Text>
        <Text color="cyan">{location}</Text>
      </Text>
      <Text color={busy ? "yellow" : snapshot.error ? "red" : "gray"}>{status}</Text>
    </Box>
  );
}

export function Footer({ view, nodeTab }: { view: AppView; nodeTab: NodeTab }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      {view === "nodes" ? (
        <Text dimColor>up/down choose node | enter open | r refresh | q quit</Text>
      ) : nodeTab === "metrics" ? (
        <Text dimColor>left/right switch tab | r refresh | q quit</Text>
      ) : (
        <Text dimColor>
          up/down choose profile | right metrics | enter stage/apply | left back | r refresh | q quit
        </Text>
      )}
    </Box>
  );
}

import { Box, Text } from "ink";
import { compactGpuName, fit } from "../lib/format";
import type { NodeView } from "../types";

export function NodeBrowser({ nodes, selectedIndex }: { nodes: NodeView[]; selectedIndex: number }) {
  const selectedNode = nodes[selectedIndex];

  return (
    <Box flexDirection="column">
      <Box gap={2}>
        <NodeList nodes={nodes} selectedIndex={selectedIndex} />
        <NodePreview node={selectedNode} />
      </Box>
    </Box>
  );
}

function NodeList({ nodes, selectedIndex }: { nodes: NodeView[]; selectedIndex: number }) {
  return (
    <Box flexDirection="column" width={48} borderStyle="single" borderColor="gray" paddingX={1}>
      <Text bold color="white">
        Cluster
      </Text>
      {nodes.map((node, index) => {
        const selected = selectedIndex === index;
        const color = !node.hasGpu ? "gray" : selected ? "cyan" : node.ready ? "white" : "yellow";
        const status = node.hasGpu ? "GPU" : "no GPU";
        const product = node.hasGpu ? compactGpuName(node.gpuProduct) : "not selectable";
        const row = `${selected ? "> " : "  "}${fit(node.name, 21).padEnd(21)} ${status.padEnd(7)} ${fit(product, 12)}`;

        if (selected) {
          return (
            <Text key={node.name} color="black" backgroundColor="cyan" dimColor={!node.hasGpu}>
              {row}
            </Text>
          );
        }

        return (
          <Text key={node.name} color={color} dimColor={!node.hasGpu}>
            {row}
          </Text>
        );
      })}
    </Box>
  );
}

function NodePreview({ node }: { node: NodeView | undefined }) {
  if (!node) {
    return (
      <Box flexDirection="column" width={66} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text bold>Node Preview</Text>
        <Text dimColor>No node selected.</Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      width={66}
      borderStyle="single"
      borderColor={node.hasGpu ? "cyan" : "gray"}
      paddingX={1}
    >
      <Text bold color={node.hasGpu ? "cyan" : "white"}>
        Node Preview
      </Text>
      <Text>
        <Text dimColor>Name </Text>
        <Text>{node.name}</Text>
      </Text>
      <Text>
        <Text dimColor>Status </Text>
        <Text color={node.ready ? "green" : "yellow"}>{node.ready ? "Ready" : "Not ready"}</Text>
      </Text>
      <Text>
        <Text dimColor>GPU </Text>
        <Text color={node.hasGpu ? "green" : "gray"}>
          {node.hasGpu ? (node.gpuProduct ?? "unknown") : "not available"}
        </Text>
      </Text>
      <Text>
        <Text dimColor>MIG </Text>
        <Text color={node.migCapable ? "green" : "gray"}>{node.migCapable ? "capable" : "not available"}</Text>
      </Text>
      <Text>
        <Text dimColor>Open </Text>
        <Text>{node.hasGpu ? "press enter to manage this node" : "this node is not selectable"}</Text>
      </Text>
    </Box>
  );
}

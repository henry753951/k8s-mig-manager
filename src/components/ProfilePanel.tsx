import { Box, Text } from "ink";
import type { MigProfile, NodeView } from "../types";

export function ProfilePanel({
  node,
  selectedIndex,
  pendingProfile,
  width = 82,
  minHeight
}: {
  node: NodeView | undefined;
  selectedIndex: number;
  pendingProfile: string | undefined;
  width?: number;
  minHeight?: number;
}) {
  if (!node) {
    return (
      <Box flexDirection="column" width={54}>
        <Text bold>Profiles</Text>
        <Text dimColor>No nodes found.</Text>
      </Box>
    );
  }

  if (!node.hasGpu) {
    return (
      <Box
        flexDirection="column"
        width={width}
        minHeight={minHeight}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text bold>Profiles</Text>
        <Text dimColor>{node.name} has no GPU resources.</Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      width={width}
      minHeight={minHeight}
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
    >
      <Text bold color="cyan">
        node/{node.name}/mig-profiles
      </Text>
      <Text>
        <Text dimColor>GPU </Text>
        <Text color="green">{node.gpuProduct ?? "unknown"}</Text>
        <Text dimColor> current </Text>
        <Text color="green">{node.migConfig ?? "unknown"}</Text>
        <Text dimColor> state </Text>
        <Text color={node.migState === "success" ? "green" : "yellow"}>{node.migState ?? "unknown"}</Text>
      </Text>
      <Text dimColor>{"  "}profile state</Text>
      {node.profiles.map((profile, index) => (
        <ProfileRow
          key={profile.name}
          profile={profile}
          selected={index === selectedIndex}
          active={profile.name === node.migConfig}
          pending={profile.name === pendingProfile}
        />
      ))}
    </Box>
  );
}

function ProfileRow({
  profile,
  selected,
  active,
  pending
}: {
  profile: MigProfile;
  selected: boolean;
  active: boolean;
  pending: boolean;
}) {
  const marker = selected ? ">" : " ";
  const state = active ? "active" : pending ? "staged" : "";
  const row = `${marker} ${profile.name.padEnd(21)} ${state || "available"}`;
  const selectedColor = pending ? "yellow" : "cyan";

  if (selected) {
    return (
      <Text color="black" backgroundColor={selectedColor}>
        {row}
      </Text>
    );
  }

  return <Text color={active ? "green" : pending ? "yellow" : "white"}>{row}</Text>;
}

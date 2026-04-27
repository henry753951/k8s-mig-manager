import { Box, Text } from "ink";
import { explainProfile } from "../content/profile-explanations";
import type { MigProfile, NodeView } from "../types";

export function SelectedProfileDetails({
  node,
  profile,
  pendingProfile,
  width = 70,
  minHeight
}: {
  node: NodeView | undefined;
  profile: MigProfile | undefined;
  pendingProfile: string | undefined;
  width?: number;
  minHeight?: number;
}) {
  if (!node?.hasGpu || !profile) {
    return null;
  }

  const active = profile.name === node.migConfig;
  const staged = profile.name === pendingProfile;
  const explanation = explainProfile(profile);
  const accentColor = active ? "green" : staged ? "yellow" : "cyan";
  const status = active ? "active" : staged ? "staged" : "ready";
  const action = staged
    ? `press enter to set ${node.name} to ${profile.name}`
    : active
      ? "already applied on this node"
      : "press enter to stage this profile";

  return (
    <Box
      flexDirection="column"
      width={width}
      minHeight={minHeight}
      borderStyle="single"
      borderColor={accentColor}
      paddingX={1}
    >
      <Text bold color={accentColor}>
        Selected Profile Detail
      </Text>
      <Box gap={2}>
        <Text>
          <Text dimColor>Profile </Text>
          <Text color={accentColor}>{profile.name}</Text>
        </Text>
        <Text>
          <Text dimColor>Status </Text>
          <Text color={active ? "green" : staged ? "yellow" : "white"}>{status}</Text>
        </Text>
      </Box>
      <DetailField label="Type" value={explanation.kind} />
      <DetailField label="Meaning" value={explanation.meaning} />
      <DetailField label="Best for" value={explanation.bestFor} />
      <DetailField label="Layout" value={explanation.layout} />
      <DetailField label="Request" value={explanation.resources} />
      <DetailField label="Action" value={action} />
    </Box>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>{label}</Text>
      <Text>{value}</Text>
    </Box>
  );
}

import { Box, Text, useWindowSize } from "ink";
import type { MigProfile, NodeView } from "../types";
import type { NodeTab } from "./Header";
import { MetricsPanel } from "./MetricsPanel";
import { ProfilePanel } from "./ProfilePanel";
import { SelectedProfileDetails } from "./SelectedProfileDetails";

const tabs: Array<{ id: NodeTab; label: string }> = [
  { id: "profiles", label: "Profiles" },
  { id: "metrics", label: "Metrics" }
];

export function NodeWorkspace({
  node,
  selectedProfile,
  selectedProfileIndex,
  pendingProfile,
  activeTab
}: {
  node: NodeView | undefined;
  selectedProfile: MigProfile | undefined;
  selectedProfileIndex: number;
  pendingProfile: string | undefined;
  activeTab: NodeTab;
}) {
  const { columns, rows } = useWindowSize();
  const availableWidth = Math.max(52, Math.min(128, columns - 4));
  const availableHeight = Math.max(14, rows - 9);
  const sideBySide = columns >= 128;
  const profileWidth = sideBySide ? 54 : availableWidth;
  const detailWidth = sideBySide ? availableWidth - profileWidth - 2 : availableWidth;
  const panelMinHeight = sideBySide ? availableHeight : Math.max(10, Math.floor(availableHeight / 2));

  return (
    <Box flexDirection="column">
      <TabBar activeTab={activeTab} />
      {activeTab === "profiles" && (
        <ProfileWorkspace
          node={node}
          selectedProfile={selectedProfile}
          selectedProfileIndex={selectedProfileIndex}
          pendingProfile={pendingProfile}
          sideBySide={sideBySide}
          profileWidth={profileWidth}
          detailWidth={detailWidth}
          minHeight={panelMinHeight}
        />
      )}
      {activeTab === "metrics" && <MetricsPanel node={node} width={availableWidth} minHeight={availableHeight} />}
    </Box>
  );
}

function ProfileWorkspace({
  node,
  selectedProfile,
  selectedProfileIndex,
  pendingProfile,
  sideBySide,
  profileWidth,
  detailWidth,
  minHeight
}: {
  node: NodeView | undefined;
  selectedProfile: MigProfile | undefined;
  selectedProfileIndex: number;
  pendingProfile: string | undefined;
  sideBySide: boolean;
  profileWidth: number;
  detailWidth: number;
  minHeight: number;
}) {
  return (
    <Box flexDirection={sideBySide ? "row" : "column"} gap={sideBySide ? 2 : 0}>
      <ProfilePanel
        node={node}
        selectedIndex={selectedProfileIndex}
        pendingProfile={pendingProfile}
        width={profileWidth}
        minHeight={minHeight}
      />
      <Box marginTop={sideBySide ? 0 : 1}>
        <SelectedProfileDetails
          node={node}
          profile={selectedProfile}
          pendingProfile={pendingProfile}
          width={detailWidth}
          minHeight={minHeight}
        />
      </Box>
    </Box>
  );
}

function TabBar({ activeTab }: { activeTab: NodeTab }) {
  return (
    <Box marginBottom={1} gap={1}>
      {tabs.map((tab) => {
        const selected = tab.id === activeTab;
        const label = ` ${tab.label} `;

        if (selected) {
          return (
            <Text key={tab.id} color="black" backgroundColor="cyan">
              {label}
            </Text>
          );
        }

        return (
          <Text key={tab.id} color="white">
            {label}
          </Text>
        );
      })}
    </Box>
  );
}

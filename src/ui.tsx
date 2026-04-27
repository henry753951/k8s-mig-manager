import { Box, useApp, useInput } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type AppView, Footer, Header, type NodeTab } from "./components/Header";
import { NodeBrowser } from "./components/NodeBrowser";
import { NodeWorkspace } from "./components/NodeWorkspace";
import { applyMigProfile, loadSnapshot } from "./kubectl";
import { wrap } from "./lib/format";
import type { ClusterSnapshot } from "./types";

const refreshMs = Number(process.env.REFRESH_MS ?? 3000);
const nodeTabs: NodeTab[] = ["profiles", "metrics"];

export function App() {
  const { exit } = useApp();
  const [snapshot, setSnapshot] = useState<ClusterSnapshot>({ nodes: [], fetchedAt: new Date() });
  const [view, setView] = useState<AppView>("nodes");
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [activeNodeTab, setActiveNodeTab] = useState<NodeTab>("profiles");
  const [pendingProfile, setPendingProfile] = useState<string>();
  const [status, setStatus] = useState("Loading cluster state...");
  const [busy, setBusy] = useState(false);

  const selectableNodeIndexes = useMemo(
    () => snapshot.nodes.map((node, index) => (node.hasGpu ? index : -1)).filter((index) => index >= 0),
    [snapshot.nodes]
  );
  const selectedNode = snapshot.nodes[selectedNodeIndex];
  const profiles = selectedNode?.profiles ?? [];
  const selectedProfile = profiles[selectedProfileIndex];

  const moveNode = useCallback(
    (delta: 1 | -1) => {
      if (selectableNodeIndexes.length === 0) return;
      const currentPosition = Math.max(0, selectableNodeIndexes.indexOf(selectedNodeIndex));
      const nextPosition = wrap(currentPosition + delta, selectableNodeIndexes.length);
      setSelectedNodeIndex(selectableNodeIndexes[nextPosition] ?? 0);
      setSelectedProfileIndex(0);
      setActiveNodeTab("profiles");
      setPendingProfile(undefined);
    },
    [selectableNodeIndexes, selectedNodeIndex]
  );

  const moveProfile = useCallback(
    (delta: 1 | -1) => {
      if (profiles.length === 0) return;
      setSelectedProfileIndex((current) => wrap(current + delta, profiles.length));
    },
    [profiles.length]
  );

  const refresh = useCallback(async () => {
    const next = await loadSnapshot();
    setSnapshot(next);
    setStatus(next.error ? `Refresh failed: ${next.error}` : `Refreshed ${next.fetchedAt.toLocaleTimeString()}`);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, refreshMs);

    return () => {
      clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    if (snapshot.nodes.length === 0) return;
    if (selectedNode?.hasGpu) return;
    const firstGpuNode = selectableNodeIndexes[0] ?? 0;
    setSelectedNodeIndex(firstGpuNode);
    setSelectedProfileIndex(0);
    setActiveNodeTab("profiles");
    setPendingProfile(undefined);
  }, [snapshot.nodes, selectedNode?.hasGpu, selectableNodeIndexes]);

  const moveNodeTab = useCallback(
    (delta: 1 | -1) => {
      const currentIndex = nodeTabs.indexOf(activeNodeTab);
      setActiveNodeTab(nodeTabs[wrap(currentIndex + delta, nodeTabs.length)] ?? "profiles");
    },
    [activeNodeTab]
  );

  const applyPendingProfile = useCallback(() => {
    if (!selectedNode || !pendingProfile || busy) return;

    setBusy(true);
    setStatus(`Applying ${pendingProfile} to ${selectedNode.name}...`);
    void applyMigProfile(selectedNode.name, pendingProfile)
      .then(async () => {
        setStatus(`Applied ${pendingProfile} to ${selectedNode.name}; waiting for MIG manager state...`);
        await refresh();
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setBusy(false);
      });
  }, [busy, pendingProfile, refresh, selectedNode]);

  useInput((input, key) => {
    if (input === "q") {
      exit();
      return;
    }

    if (input === "r") {
      void refresh();
      return;
    }

    if (view === "nodes") {
      if (key.downArrow || input === "j") {
        moveNode(1);
        return;
      }

      if (key.upArrow || input === "k") {
        moveNode(-1);
        return;
      }

      if ((key.return || key.rightArrow || input === "l") && selectedNode?.hasGpu) {
        setView("node");
        setSelectedProfileIndex(0);
        setActiveNodeTab("profiles");
        setPendingProfile(undefined);
        setStatus(`Opened ${selectedNode.name}. Choose a MIG profile.`);
      }

      return;
    }

    if (key.leftArrow || input === "h") {
      if (activeNodeTab === "profiles") {
        setView("nodes");
        setPendingProfile(undefined);
        setStatus("Back to node list.");
        return;
      }

      moveNodeTab(-1);
      return;
    }

    if (key.rightArrow || input === "l") {
      moveNodeTab(1);
      return;
    }

    if ((key.downArrow || input === "j") && activeNodeTab === "profiles") {
      moveProfile(1);
      return;
    }

    if ((key.upArrow || input === "k") && activeNodeTab === "profiles") {
      moveProfile(-1);
      return;
    }

    if (key.return && selectedProfile && activeNodeTab === "profiles") {
      if (pendingProfile === selectedProfile.name) {
        applyPendingProfile();
        return;
      }

      if (selectedProfile.name === selectedNode?.migConfig) {
        setStatus(`${selectedProfile.name} is already active on ${selectedNode.name}.`);
        return;
      }

      setPendingProfile(selectedProfile.name);
      setStatus(`Staged ${selectedProfile.name}. Press enter again to apply.`);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Header snapshot={snapshot} status={status} busy={busy} view={view} selectedNode={selectedNode} />
      {view === "nodes" ? (
        <NodeBrowser nodes={snapshot.nodes} selectedIndex={selectedNodeIndex} />
      ) : (
        <NodeWorkspace
          node={selectedNode}
          selectedProfile={selectedProfile}
          selectedProfileIndex={selectedProfileIndex}
          pendingProfile={pendingProfile}
          activeTab={activeNodeTab}
        />
      )}
      <Footer view={view} nodeTab={activeNodeTab} />
    </Box>
  );
}

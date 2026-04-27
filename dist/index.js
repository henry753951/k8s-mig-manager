#!/usr/bin/env bun
#!/usr/bin/env node

// src/index.tsx
import { render } from "ink";

// src/ui.tsx
import { Box as Box7, useApp, useInput } from "ink";
import { useCallback, useEffect, useMemo, useState } from "react";

// src/components/Header.tsx
import { Box, Text } from "ink";
import { jsx, jsxs } from "react/jsx-runtime";
var refreshMs = Number(process.env.REFRESH_MS ?? 3e3);
function Header({
  snapshot,
  status,
  busy,
  view,
  selectedNode
}) {
  const gpuNodes = snapshot.nodes.filter((node) => node.hasGpu).length;
  const location = view === "node" && selectedNode ? `cluster / ${selectedNode.name}` : "cluster";
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [
    /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { bold: true, color: "cyan", children: "K8s MIG Manager" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " " }),
      /* @__PURE__ */ jsx(Text, { color: "green", children: gpuNodes }),
      "/",
      /* @__PURE__ */ jsx(Text, { children: snapshot.nodes.length }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " GPU nodes refresh " }),
      /* @__PURE__ */ jsxs(Text, { children: [
        refreshMs / 1e3,
        "s"
      ] }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " path " }),
      /* @__PURE__ */ jsx(Text, { color: "cyan", children: location })
    ] }),
    /* @__PURE__ */ jsx(Text, { color: busy ? "yellow" : snapshot.error ? "red" : "gray", children: status })
  ] });
}
function Footer({ view, nodeTab }) {
  return /* @__PURE__ */ jsx(Box, { flexDirection: "column", marginTop: 1, children: view === "nodes" ? /* @__PURE__ */ jsx(Text, { dimColor: true, children: "up/down choose node | enter open | r refresh | q quit" }) : nodeTab === "metrics" ? /* @__PURE__ */ jsx(Text, { dimColor: true, children: "left/right switch tab | r refresh | q quit" }) : /* @__PURE__ */ jsx(Text, { dimColor: true, children: "up/down choose profile | right metrics | enter stage/apply | left back | r refresh | q quit" }) });
}

// src/components/NodeBrowser.tsx
import { Box as Box2, Text as Text2 } from "ink";

// src/lib/format.ts
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function compactGpuName(value) {
  if (!value) return "unknown";
  return value.replace(/^NVIDIA /, "").replace(/\s+/g, " ");
}
function fit(value, maxLength) {
  if (value.length <= maxLength) return value;
  if (maxLength <= 3) return value.slice(0, maxLength);
  return `${value.slice(0, maxLength - 3)}...`;
}
function formatMiB(value) {
  return value === void 0 ? "n/a" : `${value.toFixed(0)}MiB`;
}
function formatUnit(value, unit) {
  return value === void 0 ? "n/a" : `${value.toFixed(unit === "W" ? 1 : 0)}${unit}`;
}
function metricColor(value) {
  if (value >= 85) return "red";
  if (value >= 65) return "yellow";
  return "green";
}
function wrap(value, length) {
  return (value % length + length) % length;
}

// src/components/NodeBrowser.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function NodeBrowser({ nodes, selectedIndex }) {
  const selectedNode = nodes[selectedIndex];
  return /* @__PURE__ */ jsx2(Box2, { flexDirection: "column", children: /* @__PURE__ */ jsxs2(Box2, { gap: 2, children: [
    /* @__PURE__ */ jsx2(NodeList, { nodes, selectedIndex }),
    /* @__PURE__ */ jsx2(NodePreview, { node: selectedNode })
  ] }) });
}
function NodeList({ nodes, selectedIndex }) {
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", width: 48, borderStyle: "single", borderColor: "gray", paddingX: 1, children: [
    /* @__PURE__ */ jsx2(Text2, { bold: true, color: "white", children: "Cluster" }),
    nodes.map((node, index) => {
      const selected = selectedIndex === index;
      const color = !node.hasGpu ? "gray" : selected ? "cyan" : node.ready ? "white" : "yellow";
      const status = node.hasGpu ? "GPU" : "no GPU";
      const product = node.hasGpu ? compactGpuName(node.gpuProduct) : "not selectable";
      const row = `${selected ? "> " : "  "}${fit(node.name, 21).padEnd(21)} ${status.padEnd(7)} ${fit(product, 12)}`;
      if (selected) {
        return /* @__PURE__ */ jsx2(Text2, { color: "black", backgroundColor: "cyan", dimColor: !node.hasGpu, children: row }, node.name);
      }
      return /* @__PURE__ */ jsx2(Text2, { color, dimColor: !node.hasGpu, children: row }, node.name);
    })
  ] });
}
function NodePreview({ node }) {
  if (!node) {
    return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", width: 66, borderStyle: "single", borderColor: "gray", paddingX: 1, children: [
      /* @__PURE__ */ jsx2(Text2, { bold: true, children: "Node Preview" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "No node selected." })
    ] });
  }
  return /* @__PURE__ */ jsxs2(
    Box2,
    {
      flexDirection: "column",
      width: 66,
      borderStyle: "single",
      borderColor: node.hasGpu ? "cyan" : "gray",
      paddingX: 1,
      children: [
        /* @__PURE__ */ jsx2(Text2, { bold: true, color: node.hasGpu ? "cyan" : "white", children: "Node Preview" }),
        /* @__PURE__ */ jsxs2(Text2, { children: [
          /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "Name " }),
          /* @__PURE__ */ jsx2(Text2, { children: node.name })
        ] }),
        /* @__PURE__ */ jsxs2(Text2, { children: [
          /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "Status " }),
          /* @__PURE__ */ jsx2(Text2, { color: node.ready ? "green" : "yellow", children: node.ready ? "Ready" : "Not ready" })
        ] }),
        /* @__PURE__ */ jsxs2(Text2, { children: [
          /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "GPU " }),
          /* @__PURE__ */ jsx2(Text2, { color: node.hasGpu ? "green" : "gray", children: node.hasGpu ? node.gpuProduct ?? "unknown" : "not available" })
        ] }),
        /* @__PURE__ */ jsxs2(Text2, { children: [
          /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "MIG " }),
          /* @__PURE__ */ jsx2(Text2, { color: node.migCapable ? "green" : "gray", children: node.migCapable ? "capable" : "not available" })
        ] }),
        /* @__PURE__ */ jsxs2(Text2, { children: [
          /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "Open " }),
          /* @__PURE__ */ jsx2(Text2, { children: node.hasGpu ? "press enter to manage this node" : "this node is not selectable" })
        ] })
      ]
    }
  );
}

// src/components/NodeWorkspace.tsx
import { Box as Box6, Text as Text7, useWindowSize } from "ink";

// src/components/MetricsPanel.tsx
import { Box as Box3, Text as Text4 } from "ink";

// src/components/Gauge.tsx
import { Text as Text3 } from "ink";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function Gauge({
  label,
  value,
  width,
  color
}) {
  const percent = clamp(value ?? 0, 0, 100);
  const filled = Math.round(percent / 100 * width);
  return /* @__PURE__ */ jsxs3(Text3, { children: [
    /* @__PURE__ */ jsxs3(Text3, { dimColor: true, children: [
      label.padEnd(6),
      " "
    ] }),
    /* @__PURE__ */ jsx3(Text3, { color, children: "\u2588".repeat(filled) }),
    /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "\u2591".repeat(width - filled) }),
    /* @__PURE__ */ jsxs3(Text3, { children: [
      " ",
      value === void 0 ? "n/a" : `${percent.toFixed(label === "memory" ? 1 : 0)}%`
    ] })
  ] });
}
function MetricBadge({ label, value }) {
  return /* @__PURE__ */ jsxs3(Text3, { children: [
    /* @__PURE__ */ jsxs3(Text3, { dimColor: true, children: [
      label,
      " "
    ] }),
    /* @__PURE__ */ jsx3(Text3, { color: "white", children: value })
  ] });
}

// src/components/MetricsPanel.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var accentColors = ["cyan", "magenta", "green", "yellow", "blue"];
function MetricsPanel({
  node,
  width = 58,
  minHeight
}) {
  if (!node?.hasGpu) {
    return /* @__PURE__ */ jsxs4(
      Box3,
      {
        flexDirection: "column",
        width,
        minHeight,
        borderStyle: "single",
        borderColor: "gray",
        paddingX: 1,
        children: [
          /* @__PURE__ */ jsx4(Text4, { bold: true, children: "Live GPU Metrics" }),
          /* @__PURE__ */ jsx4(Text4, { dimColor: true, children: "No GPU metrics for selected node." })
        ]
      }
    );
  }
  if (node.metrics.length === 0) {
    return /* @__PURE__ */ jsxs4(
      Box3,
      {
        flexDirection: "column",
        width,
        minHeight,
        borderStyle: "single",
        borderColor: "yellow",
        paddingX: 1,
        children: [
          /* @__PURE__ */ jsx4(Text4, { bold: true, children: "Live GPU Metrics" }),
          /* @__PURE__ */ jsxs4(Text4, { color: "yellow", children: [
            "No DCGM metrics found for ",
            node.name,
            "."
          ] })
        ]
      }
    );
  }
  const cardWidth = width >= 104 ? Math.floor((width - 6) / 2) : width - 4;
  const columns = chunk(node.metrics, width >= 104 ? 2 : 1);
  const totalUsed = node.metrics.reduce((sum, metric) => sum + (metric.fbUsedMiB ?? 0), 0);
  const totalFree = node.metrics.reduce((sum, metric) => sum + (metric.fbFreeMiB ?? 0), 0);
  const avgUtil = average(node.metrics.map((metric) => metric.gpuUtil));
  const hottest = Math.max(...node.metrics.map((metric) => metric.gpuTempC ?? 0));
  return /* @__PURE__ */ jsxs4(
    Box3,
    {
      flexDirection: "column",
      width,
      minHeight,
      borderStyle: "single",
      borderColor: "cyan",
      paddingX: 1,
      children: [
        /* @__PURE__ */ jsxs4(Box3, { justifyContent: "space-between", children: [
          /* @__PURE__ */ jsx4(Text4, { bold: true, color: "cyan", children: "Live GPU Metrics" }),
          /* @__PURE__ */ jsxs4(Text4, { children: [
            /* @__PURE__ */ jsx4(Text4, { color: "magenta", children: node.metrics.length }),
            /* @__PURE__ */ jsx4(Text4, { dimColor: true, children: " devices" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs4(Box3, { marginTop: 1, gap: 2, children: [
          /* @__PURE__ */ jsx4(SummaryBadge, { label: "avg util", value: avgUtil === void 0 ? "n/a" : `${avgUtil.toFixed(0)}%`, color: "green" }),
          /* @__PURE__ */ jsx4(
            SummaryBadge,
            {
              label: "fb used",
              value: `${formatMiB(totalUsed)}/${formatMiB(totalUsed + totalFree)}`,
              color: "cyan"
            }
          ),
          /* @__PURE__ */ jsx4(SummaryBadge, { label: "hottest", value: formatUnit(hottest, "C"), color: hottest >= 80 ? "red" : "yellow" })
        ] }),
        /* @__PURE__ */ jsx4(Box3, { flexDirection: "column", marginTop: 1, children: columns.map((row, rowIndex) => /* @__PURE__ */ jsx4(Box3, { gap: 2, marginTop: rowIndex === 0 ? 0 : 1, children: row.map((metric, metricIndex) => /* @__PURE__ */ jsx4(
          MetricCard,
          {
            metric,
            width: cardWidth,
            accent: accentColors[(rowIndex * 2 + metricIndex) % accentColors.length] ?? "cyan"
          },
          metricKey(metric)
        )) }, row.map(metricKey).join(":"))) })
      ]
    }
  );
}
function MetricCard({ metric, width, accent }) {
  const memTotal = (metric.fbUsedMiB ?? 0) + (metric.fbFreeMiB ?? 0);
  const memPercent = memTotal > 0 ? (metric.fbUsedMiB ?? 0) / memTotal * 100 : void 0;
  const gpuUtil = metric.gpuUtil ?? 0;
  const title = metric.migInstanceId === void 0 ? `GPU ${metric.gpu}` : `MIG ${metric.migInstanceId} ${metric.migProfile ?? "unknown"}`;
  const gaugeWidth = Math.max(12, Math.min(24, width - 20));
  return /* @__PURE__ */ jsxs4(Box3, { flexDirection: "column", width, borderStyle: "round", borderColor: accent, paddingX: 1, children: [
    /* @__PURE__ */ jsxs4(Box3, { justifyContent: "space-between", children: [
      /* @__PURE__ */ jsx4(Text4, { bold: true, color: accent, children: fit(title, Math.max(12, width - 22)) }),
      /* @__PURE__ */ jsx4(Text4, { color: metricColor(gpuUtil), children: `${gpuUtil.toFixed(0)}%` })
    ] }),
    /* @__PURE__ */ jsx4(Text4, { dimColor: true, children: fit(metric.modelName ?? "unknown", Math.max(12, width - 4)) }),
    /* @__PURE__ */ jsx4(Gauge, { label: "util", value: gpuUtil, width: gaugeWidth, color: metricColor(gpuUtil) }),
    /* @__PURE__ */ jsx4(Gauge, { label: "memory", value: memPercent, width: gaugeWidth, color: metricColor(memPercent ?? 0) }),
    /* @__PURE__ */ jsxs4(Box3, { gap: 2, children: [
      /* @__PURE__ */ jsx4(MetricBadge, { label: "fb", value: `${formatMiB(metric.fbUsedMiB)}/${formatMiB(memTotal)}` }),
      /* @__PURE__ */ jsx4(MetricBadge, { label: "temp", value: formatUnit(metric.gpuTempC, "C") })
    ] }),
    /* @__PURE__ */ jsx4(MetricBadge, { label: "power", value: formatUnit(metric.powerW, "W") })
  ] });
}
function SummaryBadge({ label, value, color }) {
  return /* @__PURE__ */ jsxs4(Text4, { children: [
    /* @__PURE__ */ jsx4(Text4, { backgroundColor: color, color: "black", children: ` ${label} ` }),
    /* @__PURE__ */ jsxs4(Text4, { children: [
      " ",
      value
    ] })
  ] });
}
function metricKey(metric) {
  return `${metric.hostname}:${metric.uuid ?? metric.gpu}:${metric.migInstanceId ?? "full"}`;
}
function chunk(items, size) {
  const rows = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}
function average(values) {
  const present = values.filter((value) => value !== void 0);
  if (present.length === 0) return void 0;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

// src/components/ProfilePanel.tsx
import { Box as Box4, Text as Text5 } from "ink";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function ProfilePanel({
  node,
  selectedIndex,
  pendingProfile,
  width = 82,
  minHeight
}) {
  if (!node) {
    return /* @__PURE__ */ jsxs5(Box4, { flexDirection: "column", width: 54, children: [
      /* @__PURE__ */ jsx5(Text5, { bold: true, children: "Profiles" }),
      /* @__PURE__ */ jsx5(Text5, { dimColor: true, children: "No nodes found." })
    ] });
  }
  if (!node.hasGpu) {
    return /* @__PURE__ */ jsxs5(
      Box4,
      {
        flexDirection: "column",
        width,
        minHeight,
        borderStyle: "single",
        borderColor: "gray",
        paddingX: 1,
        children: [
          /* @__PURE__ */ jsx5(Text5, { bold: true, children: "Profiles" }),
          /* @__PURE__ */ jsxs5(Text5, { dimColor: true, children: [
            node.name,
            " has no GPU resources."
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs5(
    Box4,
    {
      flexDirection: "column",
      width,
      minHeight,
      borderStyle: "single",
      borderColor: "cyan",
      paddingX: 1,
      children: [
        /* @__PURE__ */ jsxs5(Text5, { bold: true, color: "cyan", children: [
          "node/",
          node.name,
          "/mig-profiles"
        ] }),
        /* @__PURE__ */ jsxs5(Text5, { children: [
          /* @__PURE__ */ jsx5(Text5, { dimColor: true, children: "GPU " }),
          /* @__PURE__ */ jsx5(Text5, { color: "green", children: node.gpuProduct ?? "unknown" }),
          /* @__PURE__ */ jsx5(Text5, { dimColor: true, children: " current " }),
          /* @__PURE__ */ jsx5(Text5, { color: "green", children: node.migConfig ?? "unknown" }),
          /* @__PURE__ */ jsx5(Text5, { dimColor: true, children: " state " }),
          /* @__PURE__ */ jsx5(Text5, { color: node.migState === "success" ? "green" : "yellow", children: node.migState ?? "unknown" })
        ] }),
        /* @__PURE__ */ jsxs5(Text5, { dimColor: true, children: [
          "  ",
          "profile state"
        ] }),
        node.profiles.map((profile, index) => /* @__PURE__ */ jsx5(
          ProfileRow,
          {
            profile,
            selected: index === selectedIndex,
            active: profile.name === node.migConfig,
            pending: profile.name === pendingProfile
          },
          profile.name
        ))
      ]
    }
  );
}
function ProfileRow({
  profile,
  selected,
  active,
  pending
}) {
  const marker = selected ? ">" : " ";
  const state = active ? "active" : pending ? "staged" : "";
  const row = `${marker} ${profile.name.padEnd(21)} ${state || "available"}`;
  const selectedColor = pending ? "yellow" : "cyan";
  if (selected) {
    return /* @__PURE__ */ jsx5(Text5, { color: "black", backgroundColor: selectedColor, children: row });
  }
  return /* @__PURE__ */ jsx5(Text5, { color: active ? "green" : pending ? "yellow" : "white", children: row });
}

// src/components/SelectedProfileDetails.tsx
import { Box as Box5, Text as Text6 } from "ink";

// src/content/profile-explanations.ts
function describeDevices(profile) {
  const devices = Object.entries(profile.devices).map(([name, count]) => `${count} x ${name}`).join(", ");
  if (devices) return devices;
  return profile.enabled ? "MIG mode enabled, no fixed slice layout" : "MIG disabled, expose full GPU";
}
function describeResources(profile) {
  const resources = Object.keys(profile.devices).map((name) => `nvidia.com/mig-${name.replace("+me", "")}`).join(", ");
  if (resources) return resources;
  return profile.enabled ? "no fixed MIG resource until slices exist" : "nvidia.com/gpu";
}
function explainProfile(profile) {
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

// src/components/SelectedProfileDetails.tsx
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function SelectedProfileDetails({
  node,
  profile,
  pendingProfile,
  width = 70,
  minHeight
}) {
  if (!node?.hasGpu || !profile) {
    return null;
  }
  const active = profile.name === node.migConfig;
  const staged = profile.name === pendingProfile;
  const explanation = explainProfile(profile);
  const accentColor = active ? "green" : staged ? "yellow" : "cyan";
  const status = active ? "active" : staged ? "staged" : "ready";
  const action = staged ? `press enter to set ${node.name} to ${profile.name}` : active ? "already applied on this node" : "press enter to stage this profile";
  return /* @__PURE__ */ jsxs6(
    Box5,
    {
      flexDirection: "column",
      width,
      minHeight,
      borderStyle: "single",
      borderColor: accentColor,
      paddingX: 1,
      children: [
        /* @__PURE__ */ jsx6(Text6, { bold: true, color: accentColor, children: "Selected Profile Detail" }),
        /* @__PURE__ */ jsxs6(Box5, { gap: 2, children: [
          /* @__PURE__ */ jsxs6(Text6, { children: [
            /* @__PURE__ */ jsx6(Text6, { dimColor: true, children: "Profile " }),
            /* @__PURE__ */ jsx6(Text6, { color: accentColor, children: profile.name })
          ] }),
          /* @__PURE__ */ jsxs6(Text6, { children: [
            /* @__PURE__ */ jsx6(Text6, { dimColor: true, children: "Status " }),
            /* @__PURE__ */ jsx6(Text6, { color: active ? "green" : staged ? "yellow" : "white", children: status })
          ] })
        ] }),
        /* @__PURE__ */ jsx6(DetailField, { label: "Type", value: explanation.kind }),
        /* @__PURE__ */ jsx6(DetailField, { label: "Meaning", value: explanation.meaning }),
        /* @__PURE__ */ jsx6(DetailField, { label: "Best for", value: explanation.bestFor }),
        /* @__PURE__ */ jsx6(DetailField, { label: "Layout", value: explanation.layout }),
        /* @__PURE__ */ jsx6(DetailField, { label: "Request", value: explanation.resources }),
        /* @__PURE__ */ jsx6(DetailField, { label: "Action", value: action })
      ]
    }
  );
}
function DetailField({ label, value }) {
  return /* @__PURE__ */ jsxs6(Box5, { flexDirection: "column", marginTop: 1, children: [
    /* @__PURE__ */ jsx6(Text6, { dimColor: true, children: label }),
    /* @__PURE__ */ jsx6(Text6, { children: value })
  ] });
}

// src/components/NodeWorkspace.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var tabs = [
  { id: "profiles", label: "Profiles" },
  { id: "metrics", label: "Metrics" }
];
function NodeWorkspace({
  node,
  selectedProfile,
  selectedProfileIndex,
  pendingProfile,
  activeTab
}) {
  const { columns, rows } = useWindowSize();
  const availableWidth = Math.max(52, Math.min(128, columns - 4));
  const availableHeight = Math.max(14, rows - 9);
  const sideBySide = columns >= 128;
  const profileWidth = sideBySide ? 54 : availableWidth;
  const detailWidth = sideBySide ? availableWidth - profileWidth - 2 : availableWidth;
  const panelMinHeight = sideBySide ? availableHeight : Math.max(10, Math.floor(availableHeight / 2));
  return /* @__PURE__ */ jsxs7(Box6, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx7(TabBar, { activeTab }),
    activeTab === "profiles" && /* @__PURE__ */ jsx7(
      ProfileWorkspace,
      {
        node,
        selectedProfile,
        selectedProfileIndex,
        pendingProfile,
        sideBySide,
        profileWidth,
        detailWidth,
        minHeight: panelMinHeight
      }
    ),
    activeTab === "metrics" && /* @__PURE__ */ jsx7(MetricsPanel, { node, width: availableWidth, minHeight: availableHeight })
  ] });
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
}) {
  return /* @__PURE__ */ jsxs7(Box6, { flexDirection: sideBySide ? "row" : "column", gap: sideBySide ? 2 : 0, children: [
    /* @__PURE__ */ jsx7(
      ProfilePanel,
      {
        node,
        selectedIndex: selectedProfileIndex,
        pendingProfile,
        width: profileWidth,
        minHeight
      }
    ),
    /* @__PURE__ */ jsx7(Box6, { marginTop: sideBySide ? 0 : 1, children: /* @__PURE__ */ jsx7(
      SelectedProfileDetails,
      {
        node,
        profile: selectedProfile,
        pendingProfile,
        width: detailWidth,
        minHeight
      }
    ) })
  ] });
}
function TabBar({ activeTab }) {
  return /* @__PURE__ */ jsx7(Box6, { marginBottom: 1, gap: 1, children: tabs.map((tab) => {
    const selected = tab.id === activeTab;
    const label = ` ${tab.label} `;
    if (selected) {
      return /* @__PURE__ */ jsx7(Text7, { color: "black", backgroundColor: "cyan", children: label }, tab.id);
    }
    return /* @__PURE__ */ jsx7(Text7, { color: "white", children: label }, tab.id);
  }) });
}

// src/kubectl.ts
import { parse as parseYaml } from "yaml";
var gpuOperatorNamespace = process.env.GPU_OPERATOR_NAMESPACE ?? "gpu-operator";
var dcgmService = process.env.DCGM_EXPORTER_SERVICE ?? "nvidia-dcgm-exporter";
async function kubectl(args, timeoutMs = 15e3) {
  const process2 = Bun.spawn(["kubectl", ...args], {
    stdout: "pipe",
    stderr: "pipe"
  });
  const timeout = setTimeout(() => {
    process2.kill();
  }, timeoutMs);
  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(process2.stdout).text(),
      new Response(process2.stderr).text(),
      process2.exited
    ]);
    if (exitCode !== 0) {
      throw new Error(stderr.trim() || `kubectl ${args.join(" ")} exited with ${exitCode}`);
    }
    return { stdout, stderr };
  } finally {
    clearTimeout(timeout);
  }
}
async function loadSnapshot() {
  try {
    const [{ stdout: nodesJson }, metrics] = await Promise.all([
      kubectl(["get", "nodes", "-o", "json"]),
      loadDcgmMetrics()
    ]);
    const nodeList = JSON.parse(nodesJson);
    const nodes = await Promise.all(nodeList.items.map((node) => toNodeView(node, metrics)));
    return {
      nodes,
      fetchedAt: /* @__PURE__ */ new Date()
    };
  } catch (error) {
    return {
      nodes: [],
      fetchedAt: /* @__PURE__ */ new Date(),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
async function applyMigProfile(nodeName, profileName) {
  await kubectl(["label", "node", nodeName, `nvidia.com/mig.config=${profileName}`, "--overwrite"], 3e4);
}
async function toNodeView(node, allMetrics) {
  const labels = node.metadata.labels ?? {};
  const allocatable = node.status?.allocatable ?? {};
  const capacity = node.status?.capacity ?? {};
  const name = node.metadata.name;
  const gpuResource = Number(
    allocatable["nvidia.com/gpu"] ?? capacity["nvidia.com/gpu"] ?? labels["nvidia.com/gpu.count"] ?? 0
  );
  const hasGpu = labels["nvidia.com/gpu.present"] === "true" || gpuResource > 0;
  const profiles = hasGpu ? await loadMigProfiles(name, allocatable, capacity) : [];
  return {
    name,
    ready: node.status?.conditions?.some((condition) => condition.type === "Ready" && condition.status === "True") ?? false,
    hasGpu,
    migCapable: labels["nvidia.com/mig.capable"] === "true",
    gpuProduct: labels["nvidia.com/gpu.product"]?.replaceAll("-", " "),
    gpuCount: gpuResource,
    migConfig: labels["nvidia.com/mig.config"],
    migState: labels["nvidia.com/mig.config.state"],
    labels,
    allocatable,
    capacity,
    profiles,
    metrics: allMetrics.filter((metric) => metric.hostname === name)
  };
}
async function loadMigProfiles(nodeName, allocatable, capacity) {
  const fromConfigMap = await loadProfilesFromConfigMap(nodeName);
  if (fromConfigMap.length > 0) {
    return fromConfigMap;
  }
  const profileNames = /* @__PURE__ */ new Set();
  for (const key of [...Object.keys(allocatable), ...Object.keys(capacity)]) {
    const match = /^nvidia\.com\/mig-(.+)$/.exec(key);
    if (match?.[1]) {
      profileNames.add(`all-${match[1]}`);
    }
  }
  const fromResources = [...profileNames].sort(sortProfiles).map((name) => ({
    name,
    enabled: true,
    devices: { [name.replace(/^all-/, "")]: Number(capacity[`nvidia.com/mig-${name.replace(/^all-/, "")}`] ?? 0) },
    source: "resources"
  }));
  return [
    ...fromResources,
    { name: "all-disabled", enabled: false, devices: {}, source: "fallback" },
    { name: "all-enabled", enabled: true, devices: {}, source: "fallback" }
  ];
}
async function loadProfilesFromConfigMap(nodeName) {
  try {
    const { stdout } = await kubectl([
      "get",
      "cm",
      "-n",
      gpuOperatorNamespace,
      `${nodeName}-mig-config`,
      "-o",
      "jsonpath={.data.config\\.yaml}"
    ]);
    const parsed = parseYaml(stdout);
    return Object.entries(parsed["mig-configs"] ?? {}).map(([name, entries]) => {
      const first = entries[0];
      return {
        name,
        enabled: first?.["mig-enabled"] ?? !name.includes("disabled"),
        devices: first?.["mig-devices"] ?? {},
        source: "configmap"
      };
    }).sort((left, right) => sortProfiles(left.name, right.name));
  } catch {
    return [];
  }
}
async function loadDcgmMetrics() {
  try {
    const { stdout } = await kubectl([
      "get",
      "--raw",
      `/api/v1/namespaces/${gpuOperatorNamespace}/services/${dcgmService}:9400/proxy/metrics`
    ]);
    return parseDcgmMetrics(stdout);
  } catch {
    return [];
  }
}
function parseDcgmMetrics(metricsText) {
  const byKey = /* @__PURE__ */ new Map();
  const wanted = /* @__PURE__ */ new Set([
    "DCGM_FI_DEV_GPU_UTIL",
    "DCGM_FI_DEV_MEM_COPY_UTIL",
    "DCGM_FI_DEV_FB_USED",
    "DCGM_FI_DEV_FB_FREE",
    "DCGM_FI_DEV_POWER_USAGE",
    "DCGM_FI_DEV_GPU_TEMP",
    "DCGM_FI_PROF_GR_ENGINE_ACTIVE",
    "DCGM_FI_PROF_DRAM_ACTIVE"
  ]);
  for (const line of metricsText.split("\n")) {
    if (line.startsWith("#") || line.trim() === "") {
      continue;
    }
    const match = /^([A-Z0-9_]+)\{([^}]*)}\s+(-?\d+(?:\.\d+)?)/.exec(line);
    const metricName = match?.[1];
    const rawLabels = match?.[2];
    const rawValue = match?.[3];
    if (!metricName || !rawLabels || !rawValue || !wanted.has(metricName)) {
      continue;
    }
    const labels = parseMetricLabels(rawLabels);
    const hostname = labels.Hostname;
    const gpu = labels.gpu;
    if (!hostname || !gpu) {
      continue;
    }
    const migInstanceId = labels.GPU_I_ID;
    const key = `${hostname}:${labels.UUID ?? gpu}:${migInstanceId ?? "full"}`;
    const existing = byKey.get(key) ?? {
      hostname,
      gpu,
      uuid: labels.UUID,
      modelName: labels.modelName,
      migProfile: labels.GPU_I_PROFILE,
      migInstanceId,
      gpuUtil: void 0,
      memUtil: void 0,
      fbUsedMiB: void 0,
      fbFreeMiB: void 0,
      powerW: void 0,
      gpuTempC: void 0
    };
    const value = Number(rawValue);
    if (metricName === "DCGM_FI_DEV_GPU_UTIL") existing.gpuUtil = value;
    if (metricName === "DCGM_FI_DEV_MEM_COPY_UTIL") existing.memUtil = value;
    if (metricName === "DCGM_FI_PROF_GR_ENGINE_ACTIVE" && existing.gpuUtil === void 0)
      existing.gpuUtil = value * 100;
    if (metricName === "DCGM_FI_PROF_DRAM_ACTIVE" && existing.memUtil === void 0) existing.memUtil = value * 100;
    if (metricName === "DCGM_FI_DEV_FB_USED") existing.fbUsedMiB = value;
    if (metricName === "DCGM_FI_DEV_FB_FREE") existing.fbFreeMiB = value;
    if (metricName === "DCGM_FI_DEV_POWER_USAGE") existing.powerW = value;
    if (metricName === "DCGM_FI_DEV_GPU_TEMP") existing.gpuTempC = value;
    byKey.set(key, existing);
  }
  return [...byKey.values()].sort(
    (left, right) => left.hostname.localeCompare(right.hostname) || left.gpu.localeCompare(right.gpu, void 0, { numeric: true }) || (left.migInstanceId ?? "").localeCompare(right.migInstanceId ?? "", void 0, { numeric: true })
  );
}
function parseMetricLabels(rawLabels) {
  const labels = {};
  const labelPattern = /([A-Za-z0-9_]+)="((?:\\"|[^"])*)"/g;
  for (const match of rawLabels.matchAll(labelPattern)) {
    const key = match[1];
    const value = match[2];
    if (key && value !== void 0) {
      labels[key] = value.replaceAll('\\"', '"');
    }
  }
  return labels;
}
function sortProfiles(left, right) {
  const priority = (name) => {
    if (name === "all-disabled") return 0;
    if (name === "all-enabled") return 1;
    if (name === "all-balanced") return 2;
    return 10;
  };
  return priority(left) - priority(right) || left.localeCompare(right, void 0, { numeric: true });
}

// src/ui.tsx
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
var refreshMs2 = Number(process.env.REFRESH_MS ?? 3e3);
var nodeTabs = ["profiles", "metrics"];
function App() {
  const { exit } = useApp();
  const [snapshot, setSnapshot] = useState({ nodes: [], fetchedAt: /* @__PURE__ */ new Date() });
  const [view, setView] = useState("nodes");
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [activeNodeTab, setActiveNodeTab] = useState("profiles");
  const [pendingProfile, setPendingProfile] = useState();
  const [status, setStatus] = useState("Loading cluster state...");
  const [busy, setBusy] = useState(false);
  const selectableNodeIndexes = useMemo(
    () => snapshot.nodes.map((node, index) => node.hasGpu ? index : -1).filter((index) => index >= 0),
    [snapshot.nodes]
  );
  const selectedNode = snapshot.nodes[selectedNodeIndex];
  const profiles = selectedNode?.profiles ?? [];
  const selectedProfile = profiles[selectedProfileIndex];
  const moveNode = useCallback(
    (delta) => {
      if (selectableNodeIndexes.length === 0) return;
      const currentPosition = Math.max(0, selectableNodeIndexes.indexOf(selectedNodeIndex));
      const nextPosition = wrap(currentPosition + delta, selectableNodeIndexes.length);
      setSelectedNodeIndex(selectableNodeIndexes[nextPosition] ?? 0);
      setSelectedProfileIndex(0);
      setActiveNodeTab("profiles");
      setPendingProfile(void 0);
    },
    [selectableNodeIndexes, selectedNodeIndex]
  );
  const moveProfile = useCallback(
    (delta) => {
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
    }, refreshMs2);
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
    setPendingProfile(void 0);
  }, [snapshot.nodes, selectedNode?.hasGpu, selectableNodeIndexes]);
  const moveNodeTab = useCallback(
    (delta) => {
      const currentIndex = nodeTabs.indexOf(activeNodeTab);
      setActiveNodeTab(nodeTabs[wrap(currentIndex + delta, nodeTabs.length)] ?? "profiles");
    },
    [activeNodeTab]
  );
  const applyPendingProfile = useCallback(() => {
    if (!selectedNode || !pendingProfile || busy) return;
    setBusy(true);
    setStatus(`Applying ${pendingProfile} to ${selectedNode.name}...`);
    void applyMigProfile(selectedNode.name, pendingProfile).then(async () => {
      setStatus(`Applied ${pendingProfile} to ${selectedNode.name}; waiting for MIG manager state...`);
      await refresh();
    }).catch((error) => {
      setStatus(error instanceof Error ? error.message : String(error));
    }).finally(() => {
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
        setPendingProfile(void 0);
        setStatus(`Opened ${selectedNode.name}. Choose a MIG profile.`);
      }
      return;
    }
    if (key.leftArrow || input === "h") {
      if (activeNodeTab === "profiles") {
        setView("nodes");
        setPendingProfile(void 0);
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
  return /* @__PURE__ */ jsxs8(Box7, { flexDirection: "column", paddingX: 1, paddingY: 1, children: [
    /* @__PURE__ */ jsx8(Header, { snapshot, status, busy, view, selectedNode }),
    view === "nodes" ? /* @__PURE__ */ jsx8(NodeBrowser, { nodes: snapshot.nodes, selectedIndex: selectedNodeIndex }) : /* @__PURE__ */ jsx8(
      NodeWorkspace,
      {
        node: selectedNode,
        selectedProfile,
        selectedProfileIndex,
        pendingProfile,
        activeTab: activeNodeTab
      }
    ),
    /* @__PURE__ */ jsx8(Footer, { view, nodeTab: activeNodeTab })
  ] });
}

// src/index.tsx
import { jsx as jsx9 } from "react/jsx-runtime";
render(/* @__PURE__ */ jsx9(App, {}));

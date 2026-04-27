# k8s-mig-manager

Ink + Bun + TypeScript CLI for viewing and changing NVIDIA GPU Operator MIG profiles on Kubernetes nodes.

## Run

```bash
cd tools/k8s-mig-manager
bun install
bun run start
```

## Lint and Format

```bash
bun run lint
bun run lint:fix
bun run format
bun run check:fix
```

These scripts call `bunx --bun @biomejs/biome@2.4.12`, so they can run even when the Biome binary is not installed globally.

## Controls

- outer layer: `up` / `down` select a node, `enter` opens a GPU node
- node layer: `left` / `right` switches between Profiles and Metrics tabs
- Profiles tab: `up` / `down` select a MIG profile, `enter` stages it, `enter` again applies it
- Profiles tab shows the selected profile detail beside the profile list on wide terminals, and below it on narrow terminals
- Profiles tab: `left` goes back to the node list
- `r`: refresh now
- `q` / `ctrl+c`: quit

The CLI only enables profile actions for nodes that advertise `nvidia.com/gpu.present=true` or `nvidia.com/gpu` resources. Non-GPU nodes are rendered dim and skipped during selection.

## How Changes Work

NVIDIA GPU Operator MIG manager watches this node label:

```bash
nvidia.com/mig.config=<profile>
```

Applying a profile is equivalent to:

```bash
kubectl label node <node> nvidia.com/mig.config=<profile> --overwrite
```

Available profiles are read from the per-node MIG manager ConfigMap first, such as `gpu-operator/<node>-mig-config`. If that is not available, the CLI falls back to profiles implied by node resources like `nvidia.com/mig-1g.12gb`.

Real-time GPU usage is read from DCGM exporter through the Kubernetes service proxy:

```bash
kubectl get --raw /api/v1/namespaces/gpu-operator/services/nvidia-dcgm-exporter:9400/proxy/metrics
```

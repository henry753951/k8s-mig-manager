import { build } from "esbuild";

await build({
  entryPoints: ["src/index.tsx"],
  outfile: "dist/index.js",
  bundle: true,
  packages: "external",
  format: "esm",
  platform: "node",
  target: "node20",
  jsx: "automatic",
  sourcemap: false,
  banner: {
    js: "#!/usr/bin/env node"
  }
});

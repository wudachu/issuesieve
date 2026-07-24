import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
  },
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    sourcemap: true,
    clean: false,
    splitting: false,
    banner: { js: "#!/usr/bin/env node" },
  },
  {
    entry: { action: "src/action.ts" },
    format: ["esm"],
    platform: "node",
    target: "node20",
    sourcemap: true,
    splitting: false,
    noExternal: ["openai", "zod"],
  },
]);

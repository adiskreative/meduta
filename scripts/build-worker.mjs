import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const openNextCli = fileURLToPath(
  new URL(
    "../node_modules/@opennextjs/cloudflare/dist/cli/index.js",
    import.meta.url,
  ),
);
const result = spawnSync(process.execPath, [openNextCli, "build"], {
  stdio: "inherit",
  env: { ...process.env, MEDUTA_PRISMA_RUNTIME: "workerd" },
});

if (result.error) {
  console.error("Failed to start the Cloudflare production build:", result.error);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}

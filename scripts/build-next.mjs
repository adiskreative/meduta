import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const runtime = process.env.MEDUTA_PRISMA_RUNTIME ?? "nodejs";
if (runtime !== "nodejs" && runtime !== "workerd") {
  throw new Error(`Unsupported Prisma runtime: ${runtime}`);
}

const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const selectClientCli = fileURLToPath(
  new URL("./select-prisma-client.mjs", import.meta.url),
);
const selectClient = spawnSync(
  process.execPath,
  [selectClientCli, runtime],
  { stdio: "inherit", env: process.env },
);

if (selectClient.error) {
  console.error("Failed to select the Prisma Client runtime:", selectClient.error);
  process.exitCode = 1;
} else if (selectClient.status !== 0) {
  process.exitCode = selectClient.status ?? 1;
} else {
  const result = spawnSync(
    process.execPath,
    [nextCli, "build", "--webpack"],
    { stdio: "inherit", env: process.env },
  );

  if (result.error) {
    console.error("Failed to start the Next.js production build:", result.error);
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
}

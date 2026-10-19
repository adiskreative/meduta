import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const runtime = process.argv[2] ?? "nodejs";
const sourceDirectory = {
  nodejs: "../generated/prisma-node",
  workerd: "../generated/prisma-workerd",
}[runtime];

if (!sourceDirectory) {
  throw new Error(`Unsupported Prisma runtime: ${runtime}`);
}

const sourcePath = fileURLToPath(new URL(sourceDirectory, import.meta.url));
const destinationPath = fileURLToPath(
  new URL("../generated/prisma", import.meta.url),
);

if (!existsSync(sourcePath)) {
  throw new Error(`Generated Prisma Client is missing: ${sourcePath}`);
}

cpSync(sourcePath, destinationPath, { recursive: true, force: true });

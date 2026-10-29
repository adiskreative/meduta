// Backfill token rahasia "Sebarkan Undangan" untuk undangan lama.
// Jalankan sekali setelah db push: node scripts/backfill-share-token.mjs
import "dotenv/config";
import { randomBytes } from "crypto";
import { Client } from "pg";

function generateShareToken() {
  return randomBytes(12).toString("base64url");
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

const { rows: pending } = await client.query(
  `SELECT id FROM "Invitation" WHERE "shareToken" IS NULL`,
);

for (const invitation of pending) {
  await client.query(`UPDATE "Invitation" SET "shareToken" = $1 WHERE id = $2`, [
    generateShareToken(),
    invitation.id,
  ]);
}

console.log(
  pending.length === 0
    ? "Semua undangan sudah punya shareToken."
    : `${pending.length} undangan diberi shareToken baru.`,
);

await client.end();

// Cek cepat: daftar Template di DB (komponen tersedia vs row DB).
// Jalankan: npx tsx scripts/list-templates.mjs (butuh DATABASE_URL di .env)
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const rows = await prisma.template.findMany({
  select: { componentKey: true, name: true, isPremium: true },
  orderBy: { componentKey: "asc" },
});
console.log(rows.map((r) => `${r.componentKey} :: ${r.name} :: premium=${r.isPremium}`).join("\n"));
await prisma.$disconnect();

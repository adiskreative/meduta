import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const templates = [
    {
      name: "Elegant Classic",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=60",
      componentKey: "classic",
      isPremium: false,
    },
    {
      name: "Modern Minimal",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=60",
      componentKey: "minimal",
      isPremium: false,
    },
    {
      name: "Floral Premium",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=60",
      componentKey: "floral",
      isPremium: true,
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { componentKey: template.componentKey },
      update: template,
      create: template,
    });
  }

  console.log("Seed selesai: 3 template berhasil dibuat.");
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
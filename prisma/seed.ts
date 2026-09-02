import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "ADMIN_EMAIL/ADMIN_PASSWORD belum di-set di .env. Akun admin tidak dibuat.",
    );
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, name: process.env.ADMIN_NAME || "Admin", password: hashed },
    create: {
      email,
      password: hashed,
      name: process.env.ADMIN_NAME || "Admin",
      role: Role.ADMIN,
    },
  });
  console.log(`Akun admin siap: ${email}`);
}

async function main() {
  await createAdmin();

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
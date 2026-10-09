import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, AssetType } from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import "dotenv/config";

/**
 * Thumbnail onyx dibaca dari manifest lib/thumbs-meta.json karena
 * generate-thumbs menamai file dengan timestamp (onyx-<ts>.webp) —
 * URL statis akan selalu basi. Fallback: foto unsplash gelap elegan.
 */
function onyxThumbUrl(): string {
  try {
    const meta = JSON.parse(
      fs.readFileSync(path.resolve("lib/thumbs-meta.json"), "utf8"),
    ) as { onyx?: { file?: string } };
    if (meta.onyx?.file) return `/thumbs/${meta.onyx.file}`;
  } catch {
    // manifest belum ada (belum pernah generate-thumbs) — pakai fallback
  }
  return "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=60";
}

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
    {
      name: "Rustic Wedding",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=600&q=60",
      componentKey: "rustic",
      isPremium: false,
    },
    {
      name: "Berkreative Royale",
      thumbnailUrl: "/design/bg-new-opt.jpg",
      componentKey: "berkreative",
      isPremium: true,
    },
    {
      name: "Garden Royale",
      thumbnailUrl:
        "https://htrcniqylvhzhkjeukcw.supabase.co/storage/v1/object/public/templates/background/45d062d5-746e-4476-8891-862c0d6ae302.jpg",
      componentKey: "garden",
      isPremium: true,
    },
    {
      name: "Botanical Garden",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&q=60",
      componentKey: "botanical",
      isPremium: true,
    },
    {
      name: "Zen Minimalist",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=60",
      componentKey: "zen",
      isPremium: true,
    },
    {
      name: "Vogue Editorial",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=60",
      componentKey: "vogue",
      isPremium: true,
    },
    {
      name: "Celestial Night",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&q=60",
      componentKey: "celestial",
      isPremium: true,
    },
    {
      name: "Scrapbook Album",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=60",
      componentKey: "scrapbook",
      isPremium: true,
    },
    {
      name: "Enchanted Garden",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=60",
      componentKey: "enchanted",
    },
    {
      name: "Fairytale Dream",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=60",
      componentKey: "fairytale",
    },
    {
      name: "Onyx Elegance",
      thumbnailUrl: onyxThumbUrl(),
      componentKey: "onyx",
      isPremium: true,
    },
    {
      name: "Purple Blossom",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1522748906645-95d8adfd52ae?w=600&q=60",
      componentKey: "purple",
      isPremium: true,
    },
    {
      name: "Wedflix Original",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=60",
      componentKey: "wedflix",
      isPremium: true,
    },
    {
      name: "Medify Album",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=60",
      componentKey: "spotify",
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

  await seedAssets();

  console.log("Seed selesai: 16 template berhasil dibuat.");
}

// Seed aset desain contoh (detail dari unsplash) + dekorasi pada template floral.
// Idempotent: dibuat hanya bila nama aset belum ada.
async function seedAssets() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL belum di-set. Aset contoh tidak dibuat.");
    return;
  }

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) return;

  const sampleAssets = [
    {
      name: "Bunga corner kiri (contoh)",
      type: AssetType.DECOR,
      url: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300&q=60",
    },
    {
      name: "Bingkai foto (contoh)",
      type: AssetType.FRAME,
      url: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=300&q=60",
    },
  ];

  const created: string[] = [];
  for (const asset of sampleAssets) {
    const exists = await prisma.templateAsset.findFirst({
      where: { name: asset.name },
      select: { id: true },
    });
    if (!exists) {
      const record = await prisma.templateAsset.create({
        data: {
          adminId: admin.id,
          name: asset.name,
          type: asset.type,
          url: asset.url,
          thumbnail: asset.url,
          meta: {},
        },
      });
      created.push(record.id);
    }
  }

  // Pasang satu dekorasi contoh (bunga pojok kiri atas) pada template floral.
  const floral = await prisma.template.findUnique({
    where: { componentKey: "floral" },
  });
  const asset = await prisma.templateAsset.findFirst({
    where: { name: "Bunga corner kiri (contoh)" },
  });

  if (floral && asset) {
    const hasDecor = await prisma.templateDecoration.findFirst({
      where: { templateId: floral.id, assetId: asset.id },
      select: { id: true },
    });
    if (!hasDecor) {
      await prisma.templateDecoration.create({
        data: {
          templateId: floral.id,
          assetId: asset.id,
          placement: "floating",
          layer: "decor",
          zIndex: 5,
          position: { x: 0, y: 0 },
          size: { width: 120, height: 120 },
          rotated: 0,
        },
      });
    }
  }

  if (created.length > 0) {
    console.log(`Aset contoh dibuat: ${created.length}.`);
  }
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
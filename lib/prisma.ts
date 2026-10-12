import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 1, // satu koneksi per request sudah cukup
    connectionTimeoutMillis: 5000, // gagal cepat, jangan menggantung
    idleTimeoutMillis: 1000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Workers: satu client per request, dikunci ke context request-nya,
// sehingga koneksi tidak pernah dipakai lintas request.
const perRequest = new WeakMap<object, PrismaClient>();

// Lokal (npm run dev): satu client global sudah aman.
const globalForPrisma = globalThis as unknown as {
  prismaDev: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (process.env.NODE_ENV === "development") {
    return (globalForPrisma.prismaDev ??= createPrismaClient());
  }
  try {
    const { ctx } = getCloudflareContext();
    let client = perRequest.get(ctx);
    if (!client) {
      client = createPrismaClient();
      perRequest.set(ctx, client);
    }
    return client;
  } catch {
    // Di luar request (misalnya saat `next build`)
    return createPrismaClient();
  }
}

// Nama `prisma` tetap sama, jadi file lain tidak perlu diubah.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
import type { NextConfig } from "next";

const prismaRuntime = process.env.MEDUTA_PRISMA_RUNTIME ?? "nodejs";
if (prismaRuntime !== "nodejs" && prismaRuntime !== "workerd") {
  throw new Error(`Runtime Prisma tidak valid: ${prismaRuntime}`);
}

const securityHeaders = [
  // SAMEORIGIN: halaman preview boleh di-frame oleh landing page sendiri
  // (thumbnail live), situs eksternal tetap diblokir (anti-klikjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Paket yang memakai build condition "workerd" di exports-nya (dibutuhkan
  // adapter Prisma/PG di Cloudflare Workers) harus disalin utuh oleh OpenNext.
  serverExternalPackages: ["pg", "pg-cloudflare"],
  // Prisma CLI & tool dev-nya tidak dipakai saat runtime. Tanpa pengecualian
  // ini file wasm-nya (pglite, schema_engine, dll.) ikut masuk Worker dan
  // membuat ukurannya melebihi batas 64 MiB Cloudflare.
  outputFileTracingExcludes: {
    "/*": [
      "node_modules/prisma/**",
      "node_modules/@prisma/dev/**",
      "node_modules/@prisma/engines/**",
      "node_modules/@electric-sql/pglite/**",
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  webpack(config, { isServer }) {
    if (isServer) {
      if (prismaRuntime === "workerd") {
        config.experiments = {
          ...config.experiments,
          asyncWebAssembly: true,
        };
      }
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

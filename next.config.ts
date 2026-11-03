import type { NextConfig } from "next";

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
      // Satu file aset desain (maks 10MB) + overhead form.
      bodySizeLimit: "12mb",
    },
    // Server action untuk halaman /admin melewati proxy, dan Next.js membuffer
    // body request yang melewati proxy. Default 10MB terlalu kecil untuk file
    // 10MB + overhead, jadi naikkan. Unggah musik tidak lewat proxy karena
    // memakai route handler /api/admin/music/upload.
    proxyClientMaxBodySize: "20mb",
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

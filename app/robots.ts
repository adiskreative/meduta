import type { MetadataRoute } from "next";

// /u/ sengaja TIDAK diblokir di sini: Google harus bisa membuka halaman itu
// agar membaca tag noindex-nya. Memblokir lewat robots.txt justru bisa
// membuat alamatnya tetap muncul di hasil pencarian.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api"],
    },
    sitemap: "https://meduta.my.id/sitemap.xml",
  };
}

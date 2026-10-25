import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api", "/u/"] },
    sitemap: "https://meduta.my.id/sitemap.xml",
  };
}
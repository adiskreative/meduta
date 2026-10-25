import type { MetadataRoute } from "next";

const base = "https://meduta.my.id";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/login", "/register", "/faq", "/pusat-bantuan", "/tim",
    "/kebijakan-privasi", "/syarat-ketentuan"];
  return pages.map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));
}
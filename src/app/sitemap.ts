import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://hiphop-roots.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
  ];
}

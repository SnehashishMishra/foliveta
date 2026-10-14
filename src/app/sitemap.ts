import type { MetadataRoute } from "next";

const siteUrl = "https://foliveta.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/read`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

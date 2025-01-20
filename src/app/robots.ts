import type { MetadataRoute } from "next";

const baseUrl = "https://plutus.priyanshpatel.site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/private/",
    },
    sitemap: baseUrl,
  };
}
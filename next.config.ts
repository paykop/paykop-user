import type { NextConfig } from "next";

/** Exact hostnames used by catalog/media. Extend via NEXT_PUBLIC_IMAGE_HOSTS. */
const defaultImageHosts = [
  "paykop-devapi.podhupu.com",
  "images.unsplash.com",
  "www.gravatar.com",
  "gravatar.com",
];

/** Wildcard CDN patterns (Next.js remotePatterns hostname wildcards). */
const defaultWildcardHosts = ["**.r2.dev"];

const imageHosts = (
  process.env.NEXT_PUBLIC_IMAGE_HOSTS?.split(",")
    .map((h) => h.trim())
    .filter(Boolean) ?? []
).concat(defaultImageHosts, defaultWildcardHosts);

const uniqueHosts = [...new Set(imageHosts)];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: uniqueHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;

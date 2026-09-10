import type { NextConfig } from "next";

/** Exact hostnames used by catalog/media. Extend via NEXT_PUBLIC_IMAGE_HOSTS. */
const defaultImageHosts = [
  "paykop-devapi.podhupu.com",
  "images.unsplash.com",
  "www.gravatar.com",
  "gravatar.com",
  "cdn.dummyjson.com",
];

const defaultWildcardHosts = [
  "*.r2.dev",
  "**.r2.dev",
  "*.gstatic.com",
  "**.gstatic.com",
  "encrypted-tbn*.gstatic.com",
  "*.googleusercontent.com",
  "**.googleusercontent.com",
  "*.google.com",
];

function parseImageHosts(): string[] {
  const fromEnv =
    process.env.NEXT_PUBLIC_IMAGE_HOSTS?.split(",")
      .map((h) => h.trim())
      .filter(Boolean) ?? [];

  const filtered = fromEnv.filter((host) => {
    if (host === "**") {
      console.warn("[next.config] Rejecting dangerous image host pattern: **");
      return false;
    }
    if (host.startsWith("http://") || host.startsWith("https://")) {
      console.warn(`[next.config] Image host should be hostname only, not URL: ${host}`);
      return false;
    }
    return true;
  });

  return [...new Set([...filtered, ...defaultImageHosts, ...defaultWildcardHosts])];
}

const uniqueHosts = parseImageHosts();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: uniqueHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

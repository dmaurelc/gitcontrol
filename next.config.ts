import type { NextConfig } from "next";

// `output: "standalone"` is required by Dokploy's Docker image (server.js
// entry) but breaks Vercel routing because Vercel manages its own output
// format. Disable when running under Vercel build.
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
    ],
  },
};

export default nextConfig;

import type { MetadataRoute } from "next";

// Web app manifest. Icons live in public/brand and are generated from the
// same isotipo as src/app/icon.svg.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GitControl",
    short_name: "GitControl",
    description: "Self-hosted GitHub dashboard",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0F0A",
    theme_color: "#0B0F0A",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

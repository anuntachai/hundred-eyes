import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hundred Eyes",
    short_name: "Hundred Eyes",
    description:
      "Village flood situation reporting — แอปรายงานสถานการณ์น้ำท่วมของหมู่บ้าน",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0284c7",
    lang: "th",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

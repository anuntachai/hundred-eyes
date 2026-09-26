import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone สำหรับ Docker deploy บน localhost (Vercel จะจัดการเอง ไม่กระทบ)
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      // local dev: Supabase CLI stack / Docker (รูปจาก storage ที่ localhost)
      { protocol: "http", hostname: "localhost", port: "54321" },
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
    ],
  },
};

export default nextConfig;

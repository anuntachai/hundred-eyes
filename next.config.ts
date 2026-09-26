import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone สำหรับ Docker deploy บน localhost (Vercel จะจัดการเอง ไม่กระทบ)
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
    // Reuse a page the browser loaded in the last 30 s instead of asking
    // the server again (switching back and forth between filters).
    staleTimes: { dynamic: 30 },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;

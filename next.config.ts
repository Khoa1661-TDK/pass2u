import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  // Card OCR runs on the server: keep tesseract unbundled and ship its model.
  serverExternalPackages: ["tesseract.js"],
  outputFileTracingIncludes: {
    "/verify": ["./node_modules/@tesseract.js-data/eng/4.0.0_best_int/**", "./node_modules/tesseract.js-core/*lstm*"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;

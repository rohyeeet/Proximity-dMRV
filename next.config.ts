import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ["src"],
  },
  // Self-contained server bundle for containerized deploys (Cloud Run, any Docker host).
  // Harmless for Vercel, which ignores it and uses its own build output.
  output: "standalone",
};

export default nextConfig;

// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Laisse passer les erreurs ESLint pendant `next build`
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Laisse passer les erreurs TypeScript pendant `next build`
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

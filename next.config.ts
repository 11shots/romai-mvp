// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Laisse passer les erreurs ESLint pendant `next build`
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

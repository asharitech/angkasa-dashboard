import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb"],
  generateBuildId: async () => {
    if (process.env.VERCEL_GIT_COMMIT_SHA)
      return process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 8);
    return `dev-${Date.now()}`;
  },
};

export default nextConfig;

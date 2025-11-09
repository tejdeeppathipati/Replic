import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure native modules are properly handled
  experimental: {
    // This helps with native module resolution
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;

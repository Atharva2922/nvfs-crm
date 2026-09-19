import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-table", "clsx", "tailwind-merge"],
  },
};

export default nextConfig;

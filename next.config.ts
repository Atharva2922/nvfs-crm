import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@tanstack/react-table",
      "clsx",
      "tailwind-merge",
      "zod",
      "bcryptjs",
    ],
  },
  async redirects() {
    return [
      {
        source: "/app/hr/leave",
        destination: "/app/hr/leaves",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

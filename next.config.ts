import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@neosale/ui', '@neosale/auth'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
  webpack: (config) => {
    // Fix Windows case-sensitivity issue with monorepo paths
    const nodeModulesPath = path.resolve(__dirname, '../node_modules');
    if (config.resolve) {
      config.resolve.modules = [
        path.resolve(__dirname, 'node_modules'),
        nodeModulesPath,
        'node_modules',
      ];
    }
    return config;
  },
};

export default nextConfig;

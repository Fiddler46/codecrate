import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/.git/**',
        '**/node_modules/**',
        '**/.next/**',
        '**/.cache/**',
        '**/.config/**',
        '**/.upm/**',
        '**/.agents/**',
        '**/.local/**',
        '**/attached_assets/**',
      ],
    }
    return config
  },
  allowedDevOrigins: ["http://localhost:3000"],
};

export default nextConfig;

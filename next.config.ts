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
        '**/.replit',
        '**/.config/**',
        '**/.upm/**',
        '**/.agents/**',
        '**/.local/**',
        '**/attached_assets/**',
      ],
    }
    return config
  },
  allowedDevOrigins: ["http://localhost:3000", "b4bb9115-4688-40f3-9972-96c0316daff8-00-2hovsp9rdmwp4.pike.replit.dev"],
};

export default nextConfig;

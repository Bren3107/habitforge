import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@xenova/transformers"],
  turbopack: {
    resolveAlias: {
      sharp: { default: "sharp" },
      "onnxruntime-node": { default: "onnxruntime-node" },
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp": false,
      "onnxruntime-node": false,
    };
    return config;
  },
};

export default nextConfig;

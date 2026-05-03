import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@xenova/transformers"],
  turbopack: {
    resolveAlias: {
      sharp: path.resolve("./lib/empty-module.js"),
      "onnxruntime-node": path.resolve("./lib/empty-module.js"),
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@xenova/transformers"],
  turbopack: {
    resolveAlias: {
      sharp: { default: "sharp" },
      "onnxruntime-node": { default: "onnxruntime-node" },
    },
  },
};

export default nextConfig;

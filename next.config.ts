import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Static export for GitHub Pages; the deploy workflow sets the repo sub-path
  output: "export",
  basePath: process.env.PAGES_BASE_PATH || "",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

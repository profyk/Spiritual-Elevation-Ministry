import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sem/shared ships TypeScript source, not a compiled build — Next.js
  // needs to run it through its own transform, same as app code.
  transpilePackages: ["@sem/shared"],
};

export default nextConfig;

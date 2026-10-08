import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // The Docker build runs Next from frontend/ inside the npm workspace.
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
};

export default nextConfig;

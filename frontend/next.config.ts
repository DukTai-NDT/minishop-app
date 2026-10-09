import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // The Docker build runs Next from frontend/ inside the npm workspace.
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://minishop-app-l9i8.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;

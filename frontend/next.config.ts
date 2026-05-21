// frontend/next.config.ts
import type { NextConfig } from "next";

// API proxying is handled by the Route Handler at src/app/api/[...path]/route.ts
// which reliably reads INTERNAL_API_URL at runtime in standalone Docker mode.
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;

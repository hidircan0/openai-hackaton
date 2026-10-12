import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.VERCEL === "1" ? {} : { output: "standalone" as const }),
};

export default nextConfig;

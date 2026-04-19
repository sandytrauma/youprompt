import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["jsdom", "html-encoding-sniffer"],
};

export default nextConfig;

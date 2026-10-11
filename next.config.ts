import type { NextConfig } from "next";

const imageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);
const target = (process.env.API_PROXY_TARGET || "http://127.0.0.1:4000").replace(/\/+$/, "");
const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.e2b.app"],
  images: {
    // WebP is the fast-encoding default; AVIF remains available for negotiated clients.
    formats: ["image/webp", "image/avif"],
    qualities: [60, 75],
    imageSizes: [32, 64, 96, 160, 256, 384],
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https" as const,
      port: "",
      hostname,
    })),
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [{ source: "/api/:path*", destination: `${target}/api/:path*` }],
    };
  },
};
export default nextConfig;

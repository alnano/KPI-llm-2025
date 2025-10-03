/** @type {import('next').NextConfig} */

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8000";

const nextConfig = {
  transpilePackages: ["@workspace/ui"],

  //proxy
  async rewrites() {
    return [
      { source: "/auth/:path*", destination: `${API_ORIGIN}/auth/:path*` },
    ];
  },
};

export default nextConfig;

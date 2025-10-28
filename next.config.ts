import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "my-cheva-api.kakashispiritnews.my.id",
        port: "", // You can leave this empty for default ports
        pathname: "/public/**", // This allows any image in this path
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**", // Allows all paths from placehold.co
      },
      {
        protocol: "https",
        hostname: "mycheva-fe-three.vercel.app",
        port: "",
        pathname: "/**", // Allows all paths from via.placeholder.com
      }
    ],
  },
};

export default nextConfig;
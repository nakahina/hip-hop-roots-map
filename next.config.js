/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "cloudflare:sockets": false,
      };
    }
    return config;
  },
  images: {
    domains: [
      "hiphop-roots-map-local.s3.ap-northeast-1.amazonaws.com", // S3 バケット
    ],
  },
};

module.exports = nextConfig;

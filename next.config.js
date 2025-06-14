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
    domains: ["i.scdn.co"],
  },
};

module.exports = nextConfig;

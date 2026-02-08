/** @type {import('next').NextConfig} */
const runtimeCaching = require("next-pwa/cache");

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: ({ url }) => {
        if (!apiBaseUrl) {
          return false;
        }
        return url.href.startsWith(apiBaseUrl);
      },
      handler: "NetworkOnly",
      method: "GET",
      options: {
        cacheName: "api-network-only"
      }
    },
    ...runtimeCaching
  ]
});

const nextConfig = {
  output: "standalone",
  reactStrictMode: true
};

module.exports = withPWA(nextConfig);

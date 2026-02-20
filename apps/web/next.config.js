/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const enablePwa = process.env.ENABLE_PWA === "true";

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
};

if (!enablePwa) {
  module.exports = nextConfig;
} else {
  const runtimeCaching = require("next-pwa/cache");
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
          cacheName: "api-network-only",
        },
      },
      ...runtimeCaching,
    ],
  });

  module.exports = withPWA(nextConfig);
}

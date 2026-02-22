/** @type {import('next').NextConfig} */
const runtimeCaching = require("next-pwa/cache");

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const apiProxyTarget = process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_BASE_URL;

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkOnly",
      options: {
        cacheName: "documents-network-only"
      }
    },
    {
      urlPattern: /^\/_next\/static\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "next-static-network-first",
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: ({ url }) => {
        if (!apiProxyTarget) {
          return false;
        }
        return url.href.startsWith(apiProxyTarget);
      },
      handler: "NetworkOnly",
      options: {
        cacheName: "api-network-only"
      }
    },
    {
      urlPattern: ({ url }) => {
        if (url.origin !== self.location.origin) {
          return false;
        }
        return [
          "/api/auth/login",
          "/api/auth/token/refresh",
          "/api/auth/logout",
          "/api/me",
          "/api/me/",
          "/api/discover"
        ].some((path) => url.pathname === path || url.pathname.startsWith(path));
      },
      handler: "NetworkOnly",
      options: {
        cacheName: "auth-network-only"
      }
    },
    ...runtimeCaching
  ]
});

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  async rewrites() {
    if (!apiProxyTarget) {
      return [];
    }
    const normalizedApiBase = apiProxyTarget.replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${normalizedApiBase}/:path*`
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

module.exports = withPWA(nextConfig);

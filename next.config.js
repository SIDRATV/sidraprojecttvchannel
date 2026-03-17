/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent double API calls in development
  staticPageGenerationTimeout: 120,
  onDemandEntries: {
    maxInactiveAge: 1 * 1000, // 1 second - very aggressive invalidation
    pagesBufferLength: 2,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**.ytimg.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  headers: async () => {
    return [
      // HTML Pages - Absolute NO Cache (forces validation every single request)
      {
        source: "/:path((?!_next/static|_next/image).*\\.html)?",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "ETag", value: "W/\"" + Date.now() + "\"" },
          { key: "Last-Modified", value: new Date().toUTCString() },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
      // All routes - Force validation on every request
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "content-type",
            value: "(?!application/.*javascript|text/css|image/.*)",
          },
        ],
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      // API Routes - NO Cache
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" },
          { key: "Pragma", value: "no-cache" },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
      // Next.js static files - Cache with long duration + immutable (versioning via build)
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Public static assets with query params for versioning
      {
        source: "/(:path*\\.(?:svg|png|jpg|jpeg|gif|webp|ico))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, must-revalidate" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      // CSS, JS files - Check with server first (revalidate)
      {
        source: "/(:path*\\.(?:css|js))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
  experimental: {
    esmExternals: true,
    serverMinification: true,
  },
};

module.exports = nextConfig;

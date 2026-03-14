/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent double API calls in development
  // Set reasonable timeout for static page generation (120 seconds)
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
      // HTML Pages - No Cache (forces browser validation every request)
      {
        source: "/:path((?!_next/static).*\\.html)?",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, public, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      // API Routes - No Cache
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
      // Next.js static files - Cache with version busting (1 year with immutable)
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Public static assets - Revalidate on every request
      {
        source: "/(:path*\\.(?:svg|png|jpg|jpeg|gif|webp|ico))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      // CSS, JS files - Check every request
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
  },
};

module.exports = nextConfig;

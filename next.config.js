/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled to prevent double API calls in development
  staticPageGenerationTimeout: 120,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000 * 60, // 25 minutes - keep pages in memory longer
    pagesBufferLength: 10,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'recharts'],
  },
  images: {
    unoptimized: true,
    minimumCacheTTL: 0,
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
      // API Routes - Short cache with background revalidation
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Cache-Control", value: "public, max-age=5, must-revalidate, s-maxage=10" },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
      // Next.js static files - Cache with long duration + immutable
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Images - No cache on Vercel CDN so updates propagate immediately
      {
        source: "/(:path*\\.(?:svg|png|jpg|jpeg|gif|webp|ico))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate, s-maxage=0" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      // CSS, JS files - Cache with short duration + revalidation
      {
        source: "/(:path*\\.(?:css|js))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, must-revalidate" },
        ],
      },
    ];
  },

};

module.exports = nextConfig;

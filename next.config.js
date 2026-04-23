/** @type {import('next').NextConfig} */
const nextConfig =
  process.env.NEXT_EXPORT === "1"
    ? // Static export for Cloudflare Workers deploy: `npm run build:export`
      { output: "export" }
    : // Dev server: proxy /api/* to the local Wrangler dev server
      {
        rewrites: async () => [
          {
            source: "/api/:path*",
            destination: "http://localhost:8787/api/:path*",
          },
        ],
      };

module.exports = nextConfig;

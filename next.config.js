/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // If you set up Farcaster's Hosted Manifest instead of a static
  // /.well-known/farcaster.json route, replace that route with a redirect
  // here instead. See README.md → "Publish to Farcaster".
};

module.exports = nextConfig;

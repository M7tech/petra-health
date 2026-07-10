/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @petra/shared is a workspace TS package; let Next transpile it.
  transpilePackages: ['@petra/shared'],
};

module.exports = nextConfig;

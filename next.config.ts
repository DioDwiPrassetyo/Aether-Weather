import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

module.exports = {
  allowedDevOrigins: ['192.168.88.254'],
}
export default nextConfig;

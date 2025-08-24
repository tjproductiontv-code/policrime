import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Forceer alias '@' -> projectroot (werkt zowel lokaal als op Vercel)
    config.resolve.alias['@'] = path.resolve(process.cwd(), '.');
    return config;
  },
};

export default nextConfig;

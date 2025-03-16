/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Konfiguration für API-Anfragen
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
    // Erhöhe die Zeitbeschränkung für API-Anfragen
    serverActions: {
      bodySizeLimit: '10mb', // Erhöhe die Größenbeschränkung für API-Anfragen
    },
  },
  
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist': require.resolve('pdfjs-dist'),
    };
    return config
  },
  
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
  
  serverRuntimeConfig: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  }
}

module.exports = nextConfig 
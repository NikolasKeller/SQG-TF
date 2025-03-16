# Erstelle oder aktualisiere next.config.js
@"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Aktualisierte Konfiguration für Next.js 15.x
  experimental: {
    // serverComponentsExternalPackages wurde zu serverExternalPackages
    serverExternalPackages: ['pdf-parse'],
    // Erhöhe die Zeitbeschränkung für API-Anfragen
    serverActions: {
      bodySizeLimit: '10mb', // Erhöhe die Größenbeschränkung für API-Anfragen
    },
  },
  
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
  
  serverRuntimeConfig: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  }
}

module.exports = nextConfig
"@ | Out-File -FilePath "next.config.js" -Encoding utf8
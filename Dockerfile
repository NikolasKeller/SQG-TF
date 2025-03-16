# Verwende Node.js 18 als Basis
FROM node:18-alpine AS base

# Installiere Abhängigkeiten nur wenn package.json sich ändert
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build-Phase
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Setze Umgebungsvariablen direkt in der Dockerfile
ENV NEXT_PUBLIC_VERCEL_ENV=production

# Build der Anwendung
RUN npm run build

# Produktions-Phase
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Kopiere notwendige Dateien
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Starte die Anwendung
CMD ["npm", "start"]

FROM node:18-alpine

WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package.json package-lock.json* ./

# Installiere Abhängigkeiten
RUN npm install

# Kopiere den Rest der Anwendung
COPY . .

# Setze Umgebungsvariablen
ENV NODE_ENV=production
ENV NEXT_PUBLIC_VERCEL_ENV=production

# Baue die Anwendung
RUN npm run build

# Starte die Anwendung
CMD ["npm", "start"] 
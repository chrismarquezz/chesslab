# Build a slim production image for the server.
FROM node:20-slim AS base
WORKDIR /app

# Install system deps (Stockfish + build tools for any native deps).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl stockfish \
  && rm -rf /var/lib/apt/lists/*

# Copy manifests first for better cache.
COPY package.json package-lock.json ./

# Install all deps (dev deps needed to compile TypeScript).
RUN npm ci

# Copy source.
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to dist/.
RUN npx tsc -p tsconfig.json

# Run with node (ts compiled output).
EXPOSE 5000
ENV PORT=5000
CMD ["node", "dist/index.js"]

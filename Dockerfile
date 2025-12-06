# Multi-stage build for Backstage FixBot

# Stage 1: Build
FROM node:18-bullseye-slim AS build

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 make g++ git ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/app/package.json ./packages/app/
COPY plugins/fixbot/package.json ./plugins/fixbot/
COPY plugins/fixbot-backend/package.json ./plugins/fixbot-backend/

# Install dependencies with timeout
RUN yarn install --frozen-lockfile --network-timeout 600000

# Copy source code
COPY . .

# Build backend bundle
RUN yarn build:backend --config app-config.yaml

# Stage 2: Runtime
FROM node:18-bullseye-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Copy built backend bundle
COPY --from=build /app/packages/backend/dist/bundle.tar.gz ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# Copy configuration files (without secrets)
COPY app-config.yaml ./
COPY app-config.production.yaml ./

# Create non-root user
RUN useradd -r -u 1001 -g root backstage && \
    chown -R backstage:root /app && \
    chmod -R 755 /app

USER backstage

# Expose backend port
EXPOSE 7007

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7007/healthcheck || exit 1

# Start backend with production config
CMD ["node", "packages/backend", "--config", "app-config.yaml", "--config", "app-config.production.yaml"]

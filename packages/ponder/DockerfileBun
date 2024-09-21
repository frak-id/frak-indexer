# Only work for distant stage, not with sqlite since using sqlite3
# Use a multi-stage build
# FROM --platform=$BUILDPLATFORM node:lts AS builder
FROM --platform=$BUILDPLATFORM oven/bun AS builder

# Create app directory
WORKDIR /building-app

# Copy the entire repo
COPY . .

# Setup bun (since we are on a node image)
# RUN npm i -g bun

# Run the installation
RUN bun install

# Start a new stage for the final image
FROM oven/bun

WORKDIR /app

# Copy the built application from the builder stage
COPY . .
COPY --from=builder /building-app/node_modules ./node_modules

ENV NODE_ENV=production
CMD ["bun", "ponder", "--config", "config/config-dev.ts", "start"]

EXPOSE 42069/tcp
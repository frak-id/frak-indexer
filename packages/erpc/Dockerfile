# Config bundler step
FROM oven/bun:latest AS bundler
RUN mkdir -p /temp/dev

# Bundle everything in a single erpc.js file
COPY . /temp/dev
RUN cd /temp/dev && bun install --production
RUN cd /temp/dev && bun build --outfile ./erpc.js --minify --target node --external "@erpc-cloud/*" src/index.ts

# Final image
#FROM erpc-dev AS final
FROM ghcr.io/erpc/erpc@sha256:c2e09378e5b7922428e8363c577fdf063aaf3d060e79ce44f8f9006c47bc80f6 AS final

# Install curl, will be used for healthcheck
RUN apt-get update && apt-get install -y curl

# Copy the bundled config
COPY --from=bundler ./temp/dev/erpc.js /root/erpc.js

# Run the server
CMD ["./erpc-server"]
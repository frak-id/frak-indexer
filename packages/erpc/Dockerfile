# Config bundler step
FROM oven/bun:latest AS bundler
RUN mkdir -p /temp/dev

# Bundle everything in a single erpc.js file
COPY . /temp/dev
RUN cd /temp/dev && bun install --production
RUN cd /temp/dev && bun build --outfile ./erpc.js --minify --target node --external "@erpc-cloud/*" src/index.ts

# Final image
#FROM erpc-dev AS final
FROM ghcr.io/erpc/erpc@sha256:c62bd25d011cb0cf354689685edcf81ef49480c532d7b980a1f4cf0be3bdd0ea AS final

# Copy the bundled config
COPY --from=bundler ./temp/dev/erpc.js /root/erpc.js

# Run the server
CMD ["./erpc-server"]
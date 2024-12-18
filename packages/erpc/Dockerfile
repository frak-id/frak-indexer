# Config bundler step
FROM oven/bun:latest AS bundler
RUN mkdir -p /temp/dev

# Bundle everything in a single erpc.js file
COPY . /temp/dev
RUN cd /temp/dev && bun install --production
RUN cd /temp/dev && bun build --outfile ./erpc.js --minify --target node --external "@erpc-cloud/*" src/index.ts

# Final image
FROM ghcr.io/erpc/erpc:main AS final

# Copy the bundled config
COPY --from=bundler ./temp/dev/erpc.js /root/erpc.js

# Run the server
CMD ["./erpc-server"]
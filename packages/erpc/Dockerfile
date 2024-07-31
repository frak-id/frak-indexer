# Base image is erpc
FROM ghcr.io/erpc/erpc:0.02-rc1

# Copy the config
COPY erpc.yaml /root/erpc.yaml

# Run the server
CMD ["./erpc-server"]
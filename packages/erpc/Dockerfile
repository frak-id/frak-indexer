# Base image is erpc
FROM ghcr.io/erpc/erpc:0.0.23

# Copy the config
COPY erpc.yaml /root/erpc.yaml

EXPOSE 8080/tcp
EXPOSE 4001/tcp

# Run the server
CMD ["./erpc-server"]
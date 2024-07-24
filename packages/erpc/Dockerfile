# Base image is erpc
FROM ghcr.io/erpc/erpc:latest

# Copy the config
COPY erpc.yaml /root/erpc.yaml

EXPOSE 4000
EXPOSE 4001

CMD ["./erpc-server"]
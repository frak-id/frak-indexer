# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install pnpm
RUN corepack enable pnpm

# install python and all the stuff required to build sqlite3
RUN apt-get update
RUN apt-get install -y \
            python3 \
            make \
            gcc \
            g++ \
            sqlite3 \
            libsqlite3-dev
RUN rm -rf /var/lib/apt/lists/*

# Copy the app
COPY . /app
WORKDIR /app

# Remove some stuff
RUN rm -rf node_modules/
RUN rm -rf package-lock.yaml

# Run the prod install
RUN pnpm install

# Run the code generation step
# todo: Normally it should be done on the dev side before pushing
#FROM base AS build
#RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
#RUN pnpm run codegen

# run the app
EXPOSE 42069/tcp
ENTRYPOINT [ "pnpm", "run", "start" ]
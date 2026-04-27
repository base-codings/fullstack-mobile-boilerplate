# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the NestJS API.
# Build context = repo root (pnpm workspace needs the root lockfile).
#
# Build: docker build -f apps/api/Dockerfile -t mobile-boilerplate-api:local .
# Run:   docker compose up api
###############

###############
# Base image
###############
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

###############
# Deps install (cached)
###############
FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

###############
# Build
###############
FROM base AS build
COPY --from=deps /app /app
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm build

###############
# Runtime (slim)
###############
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache tini wget
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/prisma ./prisma
USER node
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]

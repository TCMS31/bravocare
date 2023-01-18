# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# deps - install everything and generate the Prisma client.
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

# ---------------------------------------------------------------------------
# migrate - a one-shot image that keeps the Prisma CLI so migrations and the
# seed can run before the API starts. Compose runs it as its own service.
# ---------------------------------------------------------------------------
FROM deps AS migrate
ENV NODE_ENV=production
USER node
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js"]

# ---------------------------------------------------------------------------
# prod-deps - the same tree with devDependencies pruned away.
# ---------------------------------------------------------------------------
FROM deps AS prod-deps
RUN npm prune --omit=dev

# ---------------------------------------------------------------------------
# runtime - the API.
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json server.js ./
COPY src ./src
COPY prisma ./prisma

# node:20 ships an unprivileged `node` user; never run the API as root.
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "server.js"]

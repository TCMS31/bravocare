# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# build - produce the static bundle.
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite bakes env vars in at build time, so the API URL is a build argument
# rather than a runtime environment variable.
ARG VITE_API_BASE_URL=http://localhost:8601/api/v1/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---------------------------------------------------------------------------
# runtime - nginx-unprivileged serves the bundle as a non-root user on 8080.
# ---------------------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

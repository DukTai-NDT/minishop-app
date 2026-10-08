FROM node:22-bookworm-slim AS deps

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# npm workspaces and the lockfile live at the repository root.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci

FROM deps AS build
ENV DATABASE_URL="postgresql://minishop:build-only@db:5432/minishop?schema=public"
COPY . .
RUN npm run db:generate -w backend \
  && npm run build -w backend

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=4000
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install only production dependencies in the runtime image.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY backend/prisma ./backend/prisma
RUN npm ci --omit=dev

COPY --from=build --chown=node:node /app/backend/dist ./backend/dist
COPY --from=build --chown=node:node /app/backend/node_modules/.prisma ./backend/node_modules/.prisma

USER node
EXPOSE 4000
CMD ["node", "backend/dist/src/server.js"]

# ---- Build stage ----
# Pin a specific Node version for reproducible builds on free hosts.
FROM node:22-alpine AS build
WORKDIR /app

# Install deps (including dev) using the lockfile for reproducibility.
COPY package.json package-lock.json ./
RUN npm ci

# Generate the Prisma client, then compile TypeScript -> dist/.
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Drop dev dependencies so the runtime image is smaller.
RUN npm prune --omit=dev

# ---- Runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only what the app needs to run.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

# Hosting platforms inject PORT; the app reads process.env.PORT (defaults 3000).
EXPOSE 3000

# Apply any pending DB migrations, then start the compiled server.
# `migrate deploy` is safe/idempotent: it only runs unapplied migrations.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

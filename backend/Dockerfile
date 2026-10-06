# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# OpenSSL is needed at build time for Prisma to generate the client.
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Drop dev dependencies so the runtime image is smaller.
RUN npm prune --omit=dev

# ---- Runtime stage ----
# Use the Debian slim variant — it ships with libssl which Prisma's query
# engine binary requires at runtime. Alpine lacks it by default.
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL so Prisma's query engine can load.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]

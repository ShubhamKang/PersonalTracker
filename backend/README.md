# Personal Tracker — Backend (NestJS)

NestJS + Prisma + PostgreSQL API.

## Prerequisites
- Node.js 22+
- Docker (for local Postgres)

## Setup

```bash
# 1. Start Postgres (from repo root)
docker compose up -d

# 2. Install deps
cd backend
npm install

# 3. Create your env file
cp .env.example .env

# 4. Generate Prisma client + run migrations
npx prisma generate
npx prisma migrate dev

# 5. Run
npm run start:dev
```

## Verify

```bash
curl http://localhost:3000/health
# -> {"status":"ok","db":"up","time":"..."}
```

## Structure
- `src/main.ts` — bootstrap + global validation pipe
- `src/app.module.ts` — root module
- `src/common/prisma.service.ts` — Prisma connection lifecycle
- `src/health.controller.ts` — health/DB check
- `prisma/schema.prisma` — data model (see `../docs/02-design.md`)

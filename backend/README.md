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
- `src/auth/*` — auth (email/password + Google), JWT strategy/guard, DTOs
- `src/users/*` — user data access
- `prisma/schema.prisma` — data model (see `../docs/02-design.md`)

## Auth endpoints
| Method | Path | Auth | Body | Purpose |
|--------|------|------|------|---------|
| POST | `/auth/signup` | – | `{ email, password, timezone? }` | Create account, returns JWT |
| POST | `/auth/login` | – | `{ email, password }` | Login, returns JWT |
| POST | `/auth/google` | – | `{ idToken, timezone? }` | Google sign-in (needs `GOOGLE_CLIENT_ID`) |
| GET | `/auth/me` | Bearer | – | Current user profile |
| POST | `/auth/push-token` | Bearer | `{ token, platform }` | Register Expo push token |

Passwords are hashed with bcryptjs. JWT is a Bearer access token
(`Authorization: Bearer <token>`), expiring per `JWT_EXPIRES_IN`.

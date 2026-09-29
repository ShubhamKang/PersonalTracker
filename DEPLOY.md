# Deploying Personal Tracker — the all-free path

This guide gets the app live using **only free services** and produces the
mobile app as an **`.apk`** (not `.aab`). No paid subscriptions required.

There are three pieces:

1. **Database** — free PostgreSQL (Neon)
2. **Backend API** — free container host (Render free tier)
3. **Mobile app** — an installable `.apk` (EAS free tier *or* fully local)

---

## 0. Prerequisites (all free)

- A **GitHub** account (repo already pushed to `origin/main`).
- A **Neon** account — https://neon.tech (free Postgres).
- A **Render** account — https://render.com (free web service).
- An **Expo** account — https://expo.dev (free EAS builds), *or* Android
  Studio + JDK 17 installed locally for the fully-offline APK build.

---

## 1. Database — Neon (free Postgres)

1. Create a Neon project → it gives you a connection string like:
   ```
   postgresql://USER:PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require
   ```
2. Keep that string — it becomes `DATABASE_URL` for the backend.

> Neon free tier has no 30-day expiry (unlike Render's own free DB), which is
> why we use it instead of Render Postgres.

---

## 2. Backend — Render (free, Docker)

The repo ships a `Dockerfile` (in `backend/`) and a `render.yaml` blueprint at
the repo root.

### Option A — Blueprint (recommended)
1. In Render: **New → Blueprint**, connect this GitHub repo.
2. Render reads `render.yaml` and creates the web service.
3. When prompted, set the secret env vars:
   - `DATABASE_URL` → your Neon string from step 1.
   - `JWT_SECRET` → Render can auto-generate it, or run locally:
     ```bash
     node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
     ```
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` → leave blank unless you want
     Google sign-in (email/password works without them).
4. Deploy. On boot the container runs `prisma migrate deploy` automatically,
   then starts the API. Health check: `GET /health`.
5. Note your public URL, e.g. `https://personal-tracker-backend.onrender.com`.

### Option B — Manual
- New → **Web Service** → choose **Docker** → root directory `backend` →
  add the same env vars → deploy.

### Free-tier caveat (important)
Render's free web service **sleeps after ~15 min idle** and cold-starts
(~30s) on the next request. **While asleep, the 15-minute notification cron
does not run**, so reminders may be delayed/skipped. For a personal app this
is usually fine. If you need always-on cron for free, use **Fly.io** instead
(a single small `shared-cpu-1x` VM in its free allowance stays up better):

```bash
# One-time, from backend/ — Fly detects the Dockerfile.
fly launch --no-deploy         # creates fly.toml
fly secrets set DATABASE_URL="...neon..." JWT_SECRET="..." JWT_EXPIRES_IN=7d
fly deploy
```

---

## 3. Point the app at your backend

Edit `mobile/eas.json` and replace the placeholder in the `preview` and
`production` profiles:

```json
"env": { "EXPO_PUBLIC_API_URL": "https://your-backend.onrender.com" }
```

(For local dev you instead set `EXPO_PUBLIC_API_URL` in `mobile/.env` to your
LAN IP, e.g. `http://192.168.1.20:3000`.)

---

## 4. Build the `.apk`

Both paths below emit an **APK**. The project is configured so **every Android
build profile uses `buildType: apk`** — you will never get an `.aab`.

### Path A — EAS Build (free cloud build, easiest)
```bash
cd mobile
npm install -g eas-cli        # once
eas login                     # your free Expo account
eas build:configure           # links the project (first time only)

# Produce an installable APK using the preview profile:
eas build -p android --profile preview
```
When it finishes, EAS prints a download link to the `.apk`. Download it and
sideload onto any Android device (enable "Install unknown apps").

> Free tier builds run in a shared queue (can wait a bit) but cost nothing.

### Path B — Fully local build (no account, no cloud)
Requires Android SDK + JDK 17.
```bash
cd mobile
npx expo prebuild --platform android   # generates the native android/ project
cd android
./gradlew assembleRelease
# APK output:
#   android/app/build/outputs/apk/release/app-release.apk
```

Either way you end up with a `.apk` you can install directly — no Play Store,
no Apple Developer account, no fees.

---

## 5. Verify the live setup

```bash
# Backend health (replace host):
curl https://your-backend.onrender.com/health
# -> {"status":"ok","db":"up",...}
```
Then open the installed APK, sign up, and confirm data loads.

---

## What stays free vs. what costs money

| Piece | Free option used here | Paid only if… |
|-------|----------------------|----------------|
| Postgres | Neon free tier | you outgrow 0.5 GB |
| Backend host | Render free (or Fly free) | you want always-on / no cold start |
| Android APK | EAS free tier or local Gradle | (never required) |
| Push delivery | Expo push is free | — |
| iOS build | not covered | Apple Developer is $99/yr (Android-only stays free) |

> This app is Android-first for the free path. iOS distribution requires a
> paid Apple Developer account, so it's intentionally out of scope here.

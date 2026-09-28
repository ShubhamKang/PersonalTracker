# Personal Tracker App — Project Structure & Build Plan

## 1. Repository Layout (monorepo)

```
personal-tracker/
├── docs/
│   ├── 01-requirements.md
│   ├── 02-design.md
│   └── 03-build-plan.md
├── backend/                 # NestJS + Prisma + PostgreSQL
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── auth/            # local + google strategies, JWT
│   │   ├── users/
│   │   ├── todos/
│   │   ├── goals/          # incl. carry-over logic
│   │   ├── sections/
│   │   ├── habits/         # templates + completions + due-today
│   │   ├── notes/
│   │   ├── dev-items/
│   │   ├── notifications/  # scheduler + Expo push service
│   │   ├── common/         # date/tz utils (Luxon), guards, dto
│   │   └── main.ts
│   └── package.json
└── mobile/                  # Expo (React Native, TypeScript)
    ├── app/                 # screens (expo-router)
    │   ├── (auth)/          # login, signup
    │   ├── (tabs)/          # today, goals, habits, notes, growth
    │   └── settings/
    ├── src/
    │   ├── api/             # API client (React Query hooks)
    │   ├── components/
    │   ├── lib/             # tz/date helpers, push registration
    │   └── theme/
    └── package.json
```

## 2. Tech Choices Summary
- **Mobile:** Expo, React Native, TypeScript, expo-router, React Query, expo-notifications.
- **Backend:** NestJS, Prisma, PostgreSQL, Passport (local + google-oauth20), JWT,
  @nestjs/schedule (cron), Luxon (timezone/date), expo-server-sdk (push).
- **Hosting:** Backend + DB on Railway/Render/Fly.io; app built via EAS Build.

## 3. Phased Plan

### Phase 0 — Setup & Auth  ← we start here
- Init monorepo (backend + mobile).
- Backend: NestJS app, Prisma schema + first migration, Postgres connection.
- Auth: email/password signup+login (bcrypt + JWT), Google sign-in, timezone capture.
- Mobile: Expo app skeleton, navigation, login/signup screens, token storage,
  authenticated API client, push-token registration.
- **Exit criteria:** a user can sign up, log in, and hit an authenticated `/me` endpoint.

### Phase 1 — Dynamic Core (todos + goals)
- Daily to-do CRUD, auto-scoped to today.
- Weekly + monthly goals with STUDY/OTHER; carry-over on read; manual delete.
- "Today" dashboard.
- **Exit criteria:** goals roll over across weeks/months automatically; todos reset by day.

### Phase 2 — Auto-Recurring Habits
- Sections + habit templates (weekday schedules).
- "Due today" endpoint + completion logging + streaks.
- **Exit criteria:** define once, correct habits appear every matching weekday with no re-entry.

### Phase 3 — Customizable Notifications
- Per-section opt-in + reminder time.
- Scheduler (every 15 min) + Expo push; "what you missed today" messages; silent if all done.
- NotificationLog dedupe.
- **Exit criteria:** enabled sections send timezone-correct end-of-day reminders listing
  only incomplete items; disabled sections and todos/goals send nothing.

### Phase 4 — Notes & Development Trackers
- Notes CRUD + pin.
- Personality + skill dev items with progress.

### Phase 5 — Polish
- Streak stats, weekly review summary, data export, basic offline caching, UI refinement.

## 4. Files I Will Create in Phase 0 (preview)
Backend:
- `backend/package.json`, `backend/tsconfig.json`, `backend/nest-cli.json`
- `backend/prisma/schema.prisma`
- `backend/src/main.ts`, `backend/src/app.module.ts`
- `backend/src/auth/*` (module, controller, service, strategies, guards, dto)
- `backend/src/users/*`
- `backend/src/common/prisma.service.ts`, `backend/src/common/date.util.ts`
- `backend/.env.example`

Mobile:
- `mobile/package.json`, `mobile/app.json`, `mobile/tsconfig.json`
- `mobile/app/(auth)/login.tsx`, `signup.tsx`
- `mobile/app/(tabs)/index.tsx` (placeholder Today)
- `mobile/src/api/client.ts`, `mobile/src/lib/auth.ts`, `mobile/src/lib/push.ts`

## 5. Open Items / Future Decisions
- Refresh-token rotation strategy (Phase 0 detail).
- EAS Build + store submission (iOS needs Apple Developer account $99/yr).
- Optional per-habit reminder times (post-v1).
- Analytics/telemetry (opt-in, later).

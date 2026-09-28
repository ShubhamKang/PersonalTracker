# Personal Tracker App — Design & Architecture

## 1. High-Level Architecture

```
┌─────────────────────────┐        HTTPS / JSON         ┌──────────────────────────┐
│  Mobile App (Expo / RN)  │  ◄──────────────────────►  │   Backend API (NestJS)    │
│  - iOS + Android         │        JWT auth             │  - REST endpoints         │
│  - Expo Push token       │                             │  - Auth (local + Google)  │
└─────────────────────────┘                             │  - Business logic         │
            ▲                                            │  - Scheduler (cron)       │
            │  Expo Push Notifications                   └───────────┬──────────────┘
            └────────────────────────────────────────────────────────┤
                                                                     │
                                                          ┌──────────▼──────────┐
                                                          │   PostgreSQL         │
                                                          └──────────────────────┘
```

- **Frontend:** Expo (React Native), TypeScript. Navigation via React Navigation.
  State/data via React Query (server cache) + light local state.
- **Backend:** NestJS (TypeScript), modular. REST API. Prisma ORM.
- **Database:** PostgreSQL.
- **Auth:** Passport strategies — local (email+password, bcrypt) and Google OAuth.
  JWT access tokens.
- **Push:** Expo Push Notifications; device push tokens stored per user.
- **Scheduler:** NestJS Schedule module (cron) running every 15 minutes for reminders.

## 2. Core Design Principle: Dynamic Date/Time

Nothing about "which week/day/month" is stored as static future rows. Instead the
server computes the relevant period from `now()` in the **user's timezone**:

- **Weekday** for habits: derived from current date → matches HabitTemplate.weekday.
- **Week key** for weekly goals: ISO year-week, e.g. `2026-W40`.
- **Month key** for monthly goals: `2026-09`.

This makes recurrence and rollover "just happen" with zero manual input.

### 2.1 Habit recurrence (template → per-date completion)
- `HabitTemplate` stores the reusable definition (title + weekday).
- "Due today" = templates whose `weekday` equals today's weekday (user tz).
- Checking off creates a `HabitCompletion(habit_template_id, date)` row.
- Next week's same weekday re-shows the template automatically; a fresh date means
  no completion row yet, so it appears uncompleted. No copying, no cron needed.

### 2.2 Goal carry-over (lazy, on read)
- Goals carry a `period_key` (week or month).
- When the weekly/monthly view loads, the server computes the **current** period key.
- Incomplete goals with a **past** period_key are updated to the current period_key
  (carry-over). Completed ones stay in their original period.
- Deleting a goal is a hard delete → it stops carrying over.
- No background job required; carry-over is resolved lazily at read time.

## 3. Notification Design

- Opt-in per `Section` via `notifications_enabled` + `reminder_time` (HH:mm).
- Scheduler runs every 15 min. For each user with notification-enabled sections:
  1. Convert `now()` to user's timezone.
  2. If current local time is within the window of a section's `reminder_time`
     (and not already sent today), evaluate that section.
  3. Compute today's due habits for the section, subtract completed ones.
  4. If any remain, send an Expo push listing the missed items.
  5. If none remain → silent (send nothing).
- A `NotificationLog` prevents duplicate sends per section per day.

## 4. Data Model (Prisma-style)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?  // null if Google-only
  googleId     String?  @unique
  timezone     String   @default("Asia/Kolkata")
  pushTokens   PushToken[]
  createdAt    DateTime @default(now())
  // relations
  sections     Section[]
  goals        Goal[]
  todos        DailyTodo[]
  notes        Note[]
  devItems     DevItem[]
}

model PushToken {
  id        String @id @default(cuid())
  userId    String
  token     String @unique
  platform  String // ios | android
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Section {
  id                   String  @id @default(cuid())
  userId               String
  name                 String
  notificationsEnabled Boolean @default(false)
  reminderTime         String? // "21:30"
  user                 User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  habits               HabitTemplate[]
}

model HabitTemplate {
  id          String @id @default(cuid())
  sectionId   String
  title       String
  weekday     Int    // 0=Sun .. 6=Sat (or 1=Mon..7=Sun; fixed in impl)
  section     Section           @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  completions HabitCompletion[]
}

model HabitCompletion {
  id              String   @id @default(cuid())
  habitTemplateId String
  date            String   // "2026-09-28" (user-local date)
  completedAt     DateTime @default(now())
  habit           HabitTemplate @relation(fields: [habitTemplateId], references: [id], onDelete: Cascade)
  @@unique([habitTemplateId, date])
}

model Goal {
  id         String  @id @default(cuid())
  userId     String
  scope      String  // WEEKLY | MONTHLY
  category   String  // STUDY | OTHER
  title      String
  done       Boolean @default(false)
  periodKey  String  // "2026-W40" | "2026-09"
  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model DailyTodo {
  id     String  @id @default(cuid())
  userId String
  date   String  // "2026-09-28"
  title  String
  done   Boolean @default(false)
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Note {
  id      String  @id @default(cuid())
  userId  String
  title   String
  content String
  pinned  Boolean @default(false)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model DevItem {
  id       String @id @default(cuid())
  userId   String
  type     String // PERSONALITY | SKILL
  title    String
  progress Int    @default(0) // 0-100
  notes    String?
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model NotificationLog {
  id        String @id @default(cuid())
  sectionId String
  date      String // "2026-09-28"
  sentAt    DateTime @default(now())
  @@unique([sectionId, date])
}
```

## 5. API Surface (initial)

```
Auth
  POST   /auth/signup           { email, password, timezone }
  POST   /auth/login            { email, password }
  POST   /auth/google           { idToken }
  POST   /auth/push-token       { token, platform }

Todos
  GET    /todos/today
  POST   /todos                 { title }
  PATCH  /todos/:id             { done?, title? }
  DELETE /todos/:id

Goals
  GET    /goals?scope=WEEKLY|MONTHLY     (resolves carry-over on read)
  POST   /goals                 { scope, category, title }
  PATCH  /goals/:id             { done?, title? }
  DELETE /goals/:id

Sections & Habits
  GET    /sections
  POST   /sections              { name }
  PATCH  /sections/:id          { name?, notificationsEnabled?, reminderTime? }
  DELETE /sections/:id
  POST   /sections/:id/habits   { title, weekday }
  DELETE /habits/:id
  GET    /habits/today                    (due-today across sections)
  POST   /habits/:id/complete             (logs completion for today)
  DELETE /habits/:id/complete             (undo today's completion)

Notes
  GET/POST/PATCH/DELETE /notes

Dev Trackers
  GET/POST/PATCH/DELETE /dev-items
```

## 6. Timezone Handling
- Store user timezone (IANA string, e.g. `Asia/Kolkata`).
- All "today/week/month" computations use the user's tz via a date library (Luxon).
- `date` fields stored as user-local `YYYY-MM-DD` strings to keep day boundaries stable.

## 7. Security
- Passwords hashed with bcrypt.
- JWT for session; refresh strategy TBD in Phase 0.
- Google OAuth verified server-side (verify idToken).
- All endpoints require auth except signup/login/google.
- Per-user authorization checks on every resource.

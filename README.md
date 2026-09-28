# Personal Tracker

A multi-user native mobile app (iOS + Android) for personal life-tracking:
daily to-dos, weekly/monthly goals, auto-recurring habit sections
(Physical Fitness, Skin Care, Essential Habits, …), notes, and
personality/skill development trackers — with customizable, opt-in
per-section reminders.

## Key ideas
- **Date/time-driven:** habits auto-repeat weekly and goals roll over
  automatically; the user never types a date.
- **Customizable notifications:** opt-in per section, sent at a reminder
  time, listing only what was missed today (silent if all done).
- **Multi-user:** email/password + Google sign-in, per-user timezone,
  isolated data.

## Tech stack
- **Mobile:** Expo (React Native, TypeScript)
- **Backend:** NestJS + Prisma
- **Database:** PostgreSQL
- **Push:** Expo Push Notifications

## Documentation
- [`docs/01-requirements.md`](docs/01-requirements.md)
- [`docs/02-design.md`](docs/02-design.md)
- [`docs/03-build-plan.md`](docs/03-build-plan.md)

## Status
🚧 Early development — Phase 0 (setup & auth) next.

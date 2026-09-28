# Personal Tracker App — Requirements

## 1. Overview
A multi-user, native mobile app (iOS + Android via Expo/React Native) for personal
life-tracking. Users manage daily to-dos, weekly and monthly goals, recurring habit
sections (Physical Fitness, Skin Care, Essential Habits, etc.), important notes, and
personality/skill development trackers. The app is date/time-driven: schedules,
recurrences, and period rollovers happen automatically without the user entering any dates.

## 2. Actors
- **User** — an authenticated individual with fully isolated data.

## 3. Functional Requirements

### 3.1 Authentication & Accounts
- FR-1: Users can sign up and log in via **email + password**.
- FR-2: Users can sign up and log in via **Google sign-in**.
- FR-3: A user's **timezone** is captured at signup and editable in settings.
- FR-4: All data is isolated per user (multi-tenant by user_id).

### 3.2 Daily To-Do
- FR-5: Users add/edit/delete/check-off to-do items for **today** (date auto-derived).
- FR-6: The to-do list is automatically scoped to the current date in the user's timezone.
- FR-7: **No notifications** are sent for daily to-dos.

### 3.3 Weekly & Monthly Goals
- FR-8: Users create goals scoped as **WEEKLY** or **MONTHLY**.
- FR-9: Each goal has a category: **STUDY** or **OTHER**.
- FR-10: The current week/month is computed automatically from the current date +
  user timezone. Users never type a date.
- FR-11: Incomplete weekly goals **carry over** automatically to the next week.
- FR-12: Incomplete monthly goals **carry over** automatically to the next month.
- FR-13: Users can **manually delete** any goal to stop it carrying over.
- FR-14: **No notifications** are sent for weekly/monthly goals.

### 3.4 Habit Sections (auto-recurring)
- FR-15: Users create named **sections** (e.g., Physical Fitness, Skin Care).
- FR-16: Within a section, users define **habit templates** assigned to specific
  weekdays (Mon–Sun).
- FR-17: The app automatically shows the habits **due today** based on the current
  weekday — with no manual re-entry each week.
- FR-18: Habits **auto-repeat every week** indefinitely (template-based).
- FR-19: Users check off habits; completion is logged **per date**.
- FR-20: Streaks / completion history are tracked per habit.

### 3.5 Notifications (customizable, opt-in)
- FR-21: Notifications are **opt-in per section** (default OFF).
- FR-22: Each section with notifications ON has a **reminder time** (default 21:30,
  user-editable).
- FR-23: At the reminder time (user's local time), the app sends a push notification
  listing **only the incomplete** habits in that section for today.
  - Example: "In today's skin care routine you missed: toner, sunscreen."
  - Example: "You didn't read a book today."
- FR-24: If **all** habits in a section are complete, **no** notification is sent (silent).
- FR-25: Notifications never fire for to-dos, weekly, or monthly goals.

### 3.6 Notes
- FR-26: Users create/edit/delete notes (title + content).
- FR-27: Users can **pin** notes.

### 3.7 Development Trackers
- FR-28: Users track **Personality development** items (progress/milestones).
- FR-29: Users track **Skill development** items (progress/milestones).

## 4. Non-Functional Requirements
- NFR-1: Native app for both **iOS and Android** from a single Expo codebase.
- NFR-2: All date/time logic is **timezone-aware per user**.
- NFR-3: Secure auth (hashed passwords, JWT sessions, OAuth for Google).
- NFR-4: Data isolation and standard input validation on all endpoints.
- NFR-5: Cheap-to-host backend + database to start (Railway/Fly.io/Render tier).

## 5. Explicit Non-Goals (for now)
- No sharing/collaboration between users.
- No per-individual-habit reminder times (per-section only in v1).
- No offline-first sync engine in v1 (basic caching only; online-first).

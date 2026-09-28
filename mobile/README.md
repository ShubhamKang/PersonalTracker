# Personal Tracker — Mobile (Expo / React Native)

Cross-platform (iOS + Android) app built with Expo + expo-router.

## Prerequisites
- Node.js 22+
- The **Expo Go** app on your phone (App Store / Play Store), or an emulator
- The backend running (see `../backend/README.md`)

## Setup

```bash
cd mobile
npm install

# Configure the API URL so your phone can reach the backend over the LAN.
cp .env.example .env
# Edit .env -> EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:3000
```

> The phone and computer must be on the **same Wi-Fi network**. Use your
> machine's LAN IP (not `localhost`). On this machine it was detected as
> `10.215.144.183`.

## Run

```bash
npm start          # opens Expo dev server + QR code
# Scan the QR with Expo Go (Android) or the Camera app (iOS)
# or press "a"/"i" for emulator/simulator
```

## Verify
```bash
npm run typecheck  # tsc --noEmit, should pass with no errors
```

## Structure
- `app/_layout.tsx` — root layout, AuthProvider + auth redirect gate
- `app/(auth)/login.tsx`, `signup.tsx` — auth screens
- `app/(tabs)/` — authenticated app (Today placeholder for now)
- `src/api/client.ts` — typed API client (reads `EXPO_PUBLIC_API_URL`)
- `src/context/auth-context.tsx` — auth state + actions
- `src/lib/token-storage.ts` — secure JWT storage (expo-secure-store)
- `src/lib/push.ts` — Expo push token registration

## Notes
- Push tokens only work on physical devices, not simulators.
- Google sign-in button will be added once `GOOGLE_CLIENT_ID` is configured.

<div align="center">

# 📱 AI Home Maintenance — Mobile App

**React Native (Expo) client for the AI Home Maintenance Assistant.**

The matching backend lives in `../backend`.

</div>

---

## 🚀 Quick Start

```bash
npm install
cp .env.example .env       # set EXPO_PUBLIC_API_URL to your backend
npx expo start
```

Scan the QR code with **Expo Go** (iOS / Android), or press `a` / `i` for the emulator.

---

## 🛠️ Tech Stack

- **Expo SDK** + React Native
- **React Navigation** (native-stack + bottom-tabs)
- **Axios** HTTP client with retry + interceptors
- **Firebase Auth** bridged to backend via `/auth/sync`
- **AsyncStorage** for offline token persistence
- **Supabase / Firebase** as storage fallback chain
- **expo-camera**, **expo-sensors**, **expo-haptics**
- **react-native-pdf** for report preview

---

## 📁 Project Structure

```
mobile-app/
├── App.js                       # Root component + error boundary
├── index.js                     # Expo entry / polyfills
├── screens/                     # 40+ screens
├── components/                  # Reusable UI (cards, inputs, gradients)
├── navigation/                  # Stack + tab navigators
├── services/                    # API, Firebase, Supabase, BLE, chat
├── src/
│   ├── api/                     # Axios client with retry
│   ├── auth/                    # Firebase ↔ backend sync service
│   ├── components/              # Shared components
│   └── errors/                  # Typed API errors
├── context/                     # AuthContext, NetworkContext
├── hooks/                       # Custom hooks
├── assets/                      # Icons, splash, fonts
├── constants/                   # Theme tokens
└── __tests__/                   # Standalone test runner
```

---

## 🔑 Environment Variables

All client-side vars must be prefixed with `EXPO_PUBLIC_` so Expo inlines them at build time.

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

See `app.json` for the full Expo config.

---

## 🧪 Testing

```bash
node __tests__/run-tests.js
```

The standalone runner doesn't require Jest — keep tests lean and dependency-free.

---

## 📦 Build

```bash
npx expo export --platform web      # → dist/  (deploy to Vercel / Netlify)
npx expo export --platform android  # → android bundle
npx expo export --platform ios      # → ios bundle
```

For Play Store / App Store builds, use `eas build` (see `eas.json`).

---

## 📝 License

MIT — same as the root project.

<div align="center">

# 🏠 AI Home Maintenance Assistant

**AI-powered appliance diagnostics, predictive maintenance, and IoT monitoring — all from your phone.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React Native](https://img.shields.io/badge/React_Native-Expo-000020?logo=react&logoColor=61DAFB)](https://expo.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [Deployment](#-deployment) · [API](#-api-endpoints) · [Project Structure](#-project-structure)

</div>

---

## ✨ What is it?

A full-stack home maintenance platform that combines **multimodal AI** (image, video, audio, text, sensor), **IoT device telemetry**, and a **rule engine** to diagnose, predict, and report on appliance issues — before they become breakdowns.

The mobile app is a React Native (Expo) client. The backend is Node.js / Express / MongoDB with Google Gemini for AI and MQTT for live device data.

---

## 🚀 Features

### 🧠 Multimodal AI Diagnostics
- Image, video, audio, and text analysis through a single `POST /analyze/multimodal` endpoint
- Fallback model chain (Gemini 1.5 Flash → 1.5 Pro → 2.0) — keeps working when one model is sunset
- Deterministic **rule engine** post-process layer that overlays heuristics on AI output
- Guided troubleshooting: AI returns follow-up questions, user answers, diagnosis is refined

### 📡 IoT & Live Telemetry
- MQTT ingestion (`aihma/<userId>/<deviceId>/<sensorType>`) with topic-ownership validation
- BLE pairing flow for direct device setup
- Per-device rate limiting + per-IP brute-force protection
- Sensor-anomaly detection (temperature, vibration, power, etc.)

### 🔮 Predictive Maintenance & Risk
- Component-level **health scores** and **failure-risk** predictions
- 365-day rolling sensor history (flat shape, fast queries)
- Desktop-agent telemetry for laptops / workstations
- Per-appliance risk history endpoint

### 📄 Reports & History
- On-demand **PDF report generation** (pdfkit)
- Full analysis history with filter + search
- Cost / time / severity estimates per issue
- DIY-vs-Professional recommendations

### 🔐 Auth & Security
- JWT with server-side **revocable sessions** (logout = immediate token kill)
- Bcrypt cost-12 hashing with transparent rehash on login
- Rate-limit + mongo-sanitize + helmet
- Firebase ID-token bridge (`/auth/sync`) for mobile onboarding

### 📱 Mobile Experience
- 40+ screens: dashboard, guided diagnostics, AI chat, PDF preview, IoT pairing, alerts, settings
- Triple-storage fallback (Supabase → Firebase → Backend) so uploads always work
- Offline-first token storage with auto re-sync
- Gradient UI, haptics, animations

---

## 🏗️ Architecture

```
┌──────────────────┐    HTTPS    ┌────────────────────────┐    MQTT   ┌──────────────┐
│  Mobile App      │ ──────────► │  Express API           │ ◄──────── │  IoT Devices │
│  (Expo / RN)     │             │  + JWT auth            │           │  (ESP32 etc) │
│                  │ ◄────────── │  + rule engine         │           └──────────────┘
└──────────────────┘    JSON     │  + Gemini AI (fallback)│
        ▲                       │                        │           ┌──────────────┐
        │                       │  ┌──────────────────┐  │ ◄──────── │  Desktop     │
        │ FCM push              │  │  MongoDB Atlas   │  │  HTTP      │  Agent       │
        └───────────────────────│  │  (Mongoose)      │  │            └──────────────┘
                                │  └──────────────────┘  │
                                │  ┌──────────────────┐  │
                                │  │  Firebase Admin  │  │
                                │  └──────────────────┘  │
                                └────────────────────────┘
```

---

## 🛠️ Tech Stack

**Backend**

| Layer | Tech |
|---|---|
| Runtime | Node.js 18+, Express 4 |
| Database | MongoDB (Mongoose ODM) |
| AI | Google Gemini (multimodal) |
| Auth | JWT + bcrypt + Firebase Admin |
| IoT | MQTT broker + topic-ownership filter |
| Files | Multer + pdfkit |
| Security | helmet, express-rate-limit, express-mongo-sanitize |
| Testing | Vitest |

**Mobile App**

| Layer | Tech |
|---|---|
| Framework | React Native via Expo SDK |
| Routing | React Navigation (native-stack + bottom-tabs) |
| HTTP | Axios with retry + interceptors |
| Storage | AsyncStorage + Supabase / Firebase fallback |
| Auth | Firebase Auth + backend `/auth/sync` bridge |
| Sensors | expo-camera, expo-sensors, BLE (native module) |
| PDF | react-native-pdf previewer |

---

## 🚀 Quick Start

### Prerequisites

- Node.js **18+**
- npm or yarn
- MongoDB — local install or [Atlas free tier](https://www.mongodb.com/atlas)
- Expo CLI: `npm install -g expo-cli`
- A Google Gemini API key (optional — backend falls back to deterministic mocks)
- A Firebase project (optional — required only for the `/auth/sync` flow)

### 1. Clone & install

```bash
git clone https://github.com/NETIZEN-11/ai-home-maintenance-app.git
cd ai-home-maintenance-app
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env       # then fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm start
```

Server runs at `http://localhost:5000`. Health check: `GET /health`.

### 3. Mobile app

```bash
cd ../mobile-app
npm install
cp .env.example .env       # set EXPO_PUBLIC_API_URL=http://localhost:5000
npx expo start
```

Scan the QR code with **Expo Go** (iOS / Android) or press `a` / `i` for the emulator.

---

## 📑 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/aihma
JWT_SECRET=replace-with-a-random-string-at-least-32-chars-long
GEMINI_API_KEY=your-gemini-key

CORS_EXTRA_ORIGINS=http://localhost:8081
```

### Mobile (`mobile-app/.env`)

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

---

## ☁️ Deployment

### Backend → Render

1. Create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, grab the connection string.
2. On [Render](https://render.com): **New +** → **Web Service** → connect this repo.
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add env vars (`MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `NODE_ENV=production`).
7. Deploy — your backend is live at `https://<name>.onrender.com`.

### Mobile app → Vercel (web build)

```bash
cd mobile-app
npx expo export --platform web
vercel --prod
```

Set root directory to `mobile-app`, output to `dist`. Add all `EXPO_PUBLIC_*` env vars in the Vercel project settings.

> ⚠️ **Uploads are ephemeral on Render's free tier.** Files are wiped on each deploy. For production, swap multer's disk storage for **Cloudinary** or **AWS S3** (one-file change in `middleware/uploadMiddleware.js`).

---

## 🔌 API Endpoints

> All routes under `/api` require `Authorization: Bearer <jwt>` unless noted.

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Email + password signup |
| `POST` | `/auth/login` | Login → returns JWT |
| `POST` | `/auth/sync` | Firebase ID-token bridge (creates account if new) |
| `POST` | `/auth/logout` | Revoke session |

### Appliances & Devices
| Method | Path | Description |
|---|---|---|
| `GET / POST` | `/appliances` | List / create |
| `PUT / DELETE` | `/appliances/:id` | Update / delete |
| `GET / POST` | `/devices` | List / register IoT devices |
| `DELETE` | `/devices/:id` | Unregister |

### AI & Diagnostics
| Method | Path | Description |
|---|---|---|
| `POST` | `/analyze/image` | Image → diagnosis |
| `POST` | `/analyze/video` | Video → diagnosis |
| `POST` | `/analyze/audio` | Audio → diagnosis |
| `POST` | `/analyze/multimodal` | Combined inputs |
| `POST` | `/diagnostic/run` | Diagnostic test (sound / vibration / etc.) |
| `GET` | `/diagnostic/history` | Past runs |
| `POST` | `/chat/start` `/chat/message` | Conversational troubleshooting |

### IoT & Telemetry
| Method | Path | Description |
|---|---|---|
| `POST` | `/iot/ingest` | MQTT → REST bridge |
| `GET` | `/iot/devices/:id/health` | Latest sensor snapshot |
| `GET` | `/iot/devices/:id/alerts` | Threshold breaches |
| `POST` | `/iot/devices/:id/command` | Send a command to device |

### Risk & Predictive Maintenance
| Method | Path | Description |
|---|---|---|
| `GET` | `/risk/:applianceId` | Current risk score |
| `GET` | `/risk/:applianceId/history` | Time-series |
| `GET` | `/maintenance/predictions` | Component health across all appliances |

### Reports
| Method | Path | Description |
|---|---|---|
| `GET / POST` | `/reports` | List / generate |
| `GET` | `/reports/:id/pdf` | Stream PDF |

### Rules Engine
| Method | Path | Description |
|---|---|---|
| `GET / POST / PUT / DELETE` | `/rules/*` | Manage deterministic overlay rules |
| `GET` | `/rules/:id/trace` | Why a rule fired on a given analysis |

### Desktop Agent
| Method | Path | Description |
|---|---|---|
| `POST` | `/desktop-agent/heartbeat` | Push CPU / RAM / disk telemetry |
| `GET` | `/desktop-agent/status` | Aggregate health |

Full OpenAPI spec is auto-generated from route files — see `backend/scripts/manual/`.

---

## 📁 Project Structure

```
ai-home-maintenance-app/
├── backend/
│   ├── server.js              # Express + Socket.IO entry point
│   ├── controllers/           # Route handlers (17 modules)
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers (16 modules)
│   ├── middleware/            # auth, upload, rate-limit, validation, logger
│   ├── services/              # AI, IoT, PDF, rules, notifications, scoring
│   ├── src/
│   │   ├── config/            # Central env + limits
│   │   ├── constants/         # Magic-number registry
│   │   ├── errors/            # ApiError hierarchy
│   │   └── middleware/        # Request validator
│   ├── __tests__/             # Vitest specs
│   └── scripts/               # Migration + manual test scripts
│
└── mobile-app/
    ├── App.js                 # Root component
    ├── index.js               # Expo entry
    ├── screens/               # 40+ screens (home, diagnostics, IoT, settings)
    ├── components/            # Reusable UI (cards, inputs, gradients)
    ├── navigation/            # Stack + tab navigators
    ├── services/              # API, Firebase, Supabase, BLE, chat
    ├── context/               # Auth + network state
    ├── src/
    │   ├── api/               # Axios client with retry
    │   ├── auth/              # Firebase ↔ backend sync
    │   ├── components/        # Shared components
    │   └── errors/            # Typed API errors
    ├── hooks/                 # Custom React hooks
    └── __tests__/             # Mobile specs
```

---

## 🧪 Testing

```bash
cd backend
npm test                  # all Vitest specs

cd ../mobile-app
node __tests__/run-tests.js   # standalone runner (no Jest)
```

End-to-end manual smoke scripts live in `backend/scripts/manual/`.

---

## 🔐 Security Notes

- Never commit `.env` — both folders ship a `.env.example` template.
- JWT secrets must be **≥ 32 chars**; server refuses to start otherwise.
- All request bodies are mongo-sanitized (`$`-prefixed keys stripped).
- Rate limits: 100 req / 15 min general, 5 attempts / 15 min on auth.
- Uploads use `crypto.randomBytes` filenames — no collisions under concurrency.
- Server-side session store means **logout kills the JWT immediately**.

---

## 🤝 Contributing

Pull requests welcome. For major changes, open an issue first.

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "feat: ..."`
4. Push and open a PR

---

## 📝 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

**Built by [NETIZEN-11](https://github.com/NETIZEN-11)**

⭐ Star the repo if it helped you!

</div>
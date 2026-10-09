# Raha Product Plane Backend

Lightweight, high-performance product backend for **Raha (Glacial Threat Early Warning System)**.

This backend serves the mobile application (Phone OTP Auth, Spatial Safe Points Registry, Realtime Alert Subscriptions, SOS Broadcasts, Hazard Avoidance Routing) and provides an authenticated webhook ingestion endpoint for AWS Data Plane assessments.

---

## 🏛 Architecture Overview

```
                                  +-----------------------------+
                                  | Heavy AWS Data Plane        |
                                  | (Sentinel/Landsat + GDAL    |
                                  |  + SageMaker + Bedrock)     |
                                  +--------------+--------------+
                                                 |
                                                 | POST /api/internal/assessment-sync
                                                 | (x-api-secret secured)
                                                 v
+-----------------------+         +--------------+--------------+
| Raha Mobile App       | <=====> | Raha Product Backend        | <=====> [ PostgreSQL + PostGIS ]
| (React Native Expo)   | REST/WS | (Node.js + Express + WS)    |         (or in-memory dev mode)
+-----------------------+         +-----------------------------+
```

### Key Features
1. **Zero-Egress Decoupling**: Heavy satellite processing stays in AWS `us-west-2`. Lightweight product interactions run on this fast API server with minimal AWS costs and zero Cognito/AppSync friction.
2. **PostGIS Spatial Safe-Point Routing**: Spatial querying for high ground evacuation shelters (`/api/safe-points/nearest`).
3. **Resilient Dual Mode**: Connects to live PostgreSQL/PostGIS if `DATABASE_URL` is active; automatically falls back to an in-memory repository for local development and offline work without crashing.
4. **Realtime Dual Channel**:
   - **WebSocket** (`/ws`): Full bi-directional connection.
   - **Server-Sent Events** (`/api/realtime/stream`): Ultra-low battery consumption stream for active disaster monitoring.
5. **AWS Data Plane Bridge**: Secure webhook (`/api/internal/assessment-sync`) for automated satellite ML pipeline updates.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `4000` | Port for Express & WebSocket server |
| `DATABASE_URL` | `postgresql://...` | Connection string for PostgreSQL + PostGIS |
| `AWS_WEBHOOK_SECRET` | `raha_internal_...` | Shared secret for AWS Step Functions / SageMaker webhooks |
| `CORS_ORIGIN` | `*` | Allowed CORS origins for Expo Web / native apps |

### 3. Start Development Server
```bash
npm run dev
```

### 4. (Optional) Run Database Migrations & Seeds on PostGIS
If you have PostgreSQL running:
```bash
npm run db:seed
```

---

## 📡 API Endpoints

### Mobile App Core Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server and database health check |
| `GET` | `/api/assessments/active?zoneId=:id` | Current threat level (Clear, Watch, Warning, Evacuate) |
| `GET` | `/api/lakes` | Glacial lakes registry (Imja Tsho, Tsho Rolpa, South Lhonak) |
| `GET` | `/api/safe-points` | Safe high ground evacuation shelters |
| `GET` | `/api/safe-points/nearest?lat=&lon=&limit=` | Spatial PostGIS nearest shelter calculation |
| `GET` | `/api/events?level=:level` | Satellite & hydro-gauge telemetry log |
| `GET` | `/api/user/profile` | Resident user profile, consent, and language settings |
| `PATCH`| `/api/user/profile` | Update profile settings |
| `POST` | `/api/user/contacts` | Add emergency SOS contact |
| `PATCH`| `/api/user/contacts/:id` | Toggle active status for SOS contact |
| `DELETE`| `/api/user/contacts/:id` | Remove emergency contact |
| `POST` | `/api/alerts/sos-broadcast` | Trigger emergency SOS broadcast & contact fan-out |
| `POST` | `/api/scenario/set-level` | Demo state switch (Clear $\to$ Evacuate) |
| `POST` | `/api/routes/calculate` | Hazard avoidance evacuation route calculator |
| `GET` | `/api/routes/offline-pack` | Download offline GeoJSON shelters & routes pack |

### Auth Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Request 6-digit SMS OTP |
| `POST` | `/api/auth/verify-otp` | Verify OTP code & receive authentication session |

### Realtime & AWS Bridge Endpoints
| Protocol | Endpoint | Description |
| :--- | :--- | :--- |
| `SSE` | `/api/realtime/stream` | Battery-efficient Server-Sent Events stream for mobile alerts |
| `WS` | `/ws` | WebSocket server for bidirectional event dispatch |
| `POST` | `/api/internal/assessment-sync` | AWS Step Functions/SageMaker webhook bridge (`x-api-secret`) |

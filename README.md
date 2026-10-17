# 🧠 Project-23 — AI-Powered Smart Employee Monitoring & Attendance System

> A full-stack CCTV employee-monitoring platform: a **React + TypeScript** dashboard frontend and a
> **FastAPI** backend that uses **facial recognition** and **YOLO** activity detection on live camera
> feeds for automated attendance and workplace-activity monitoring — backed by **PostgreSQL**,
> **Redis**, **Celery**, and **Docker**.

---

## ✨ What's inside

**Backend (FastAPI)**
- 🎭 **Face-recognition attendance** — automated check-in/check-out from live camera feeds (`face_recognition` + `dlib`)
- 🤖 **Activity detection** — mobile-phone use, drowsiness/sleeping (eye-closure + posture), and restricted-zone checks via YOLOv8
- 📷 **Multi-camera management** — register and stream USB / IP / RTSP cameras, with live JPEG over WebSocket
- 👥 **Employee & department management** — full CRUD, photo upload with content validation, shift scheduling
- 📊 **Dashboard & reports** — real-time KPIs, exportable Excel/PDF reports via Celery background tasks
- 🚨 **Alerts & evidence** — activity alerts over WebSocket, with screenshot evidence linked to events
- 📈 **Prometheus metrics** at `/metrics`

**Frontend (React + Vite)**
- 💻 **Premium dashboard UI** — public landing/marketing pages plus role-aware Admin and Employee dashboards
- 🎨 Glassmorphism design, iPad-style floating navigation, charts, and a CCTV-style login
- 🧩 Built with a clean **services/mock-data layer**, so the real backend can be wired in without rebuilding the UI
- ⚠️ Currently runs on **mock data** (not yet connected to the backend API)

**Security (hardened — see [Security](#-security))**
- 🔐 JWT access/refresh flow with **access-token-type enforcement** and Redis-backed revocation (logout)
- 🛡️ Role-based access control: **ADMIN / OPERATOR / VIEWER** (enforced server-side on the DB role)
- 🚦 Real per-route **rate limiting** (`slowapi`), WebSocket authentication, strict CORS allow-list
- ✅ Input validation, upload/path-traversal protection, and clean error responses

**Local tooling**
- 🎥 **Live webcam demo** — try the detection pipeline with your laptop camera before connecting real CCTV (see [below](#-live-webcam-demo))
- 🧪 **Automated test suite** — 141 tests (`pytest`) covering auth, authorization, validation, attendance concurrency, and the demo

---

## 🏗️ Project structure

```
Project-23/
├── frontend/                   # React + Vite + TypeScript dashboard (mock data)
│   ├── src/
│   │   ├── pages/              # public, auth, admin, employee pages
│   │   ├── components/         # UI, charts, layout, cameras, auth
│   │   ├── services/           # mock data + API-boundary (swap for real backend later)
│   │   └── ...
│   └── package.json
│
├── app/                        # FastAPI backend
│   ├── api/                    # routers (v1), websockets, dependencies, rate limiting
│   ├── core/                   # config, security (JWT/bcrypt), logging, constants
│   ├── services/               # business logic (attendance, activity, reports, ...)
│   ├── repositories/           # async SQLAlchemy data access
│   ├── schemas/                # Pydantic request/response models
│   ├── infrastructure/
│   │   ├── ai/                 # YOLO + face-recognition model registry & detectors
│   │   ├── camera/             # camera stream manager (USB/IP/RTSP)
│   │   ├── database/           # SQLAlchemy models & async connection
│   │   └── storage/            # media / evidence handling
│   ├── workers/                # Celery tasks & beat scheduler
│   └── demo/                   # local live-webcam demo (isolated, no DB writes)
│
├── tests/                      # pytest suite (141 tests)
├── migrations/                 # Alembic migrations
├── docker/                     # Nginx config & TLS certs
├── docs/live_webcam_demo.md    # webcam demo guide
├── Dockerfile / Dockerfile.worker
└── docker-compose.yml          # full stack: postgres, redis, app, worker, beat, nginx
```

---

## ⚙️ Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, React Router, Recharts, Radix UI, Lucide |
| **API** | FastAPI + Uvicorn |
| **Database** | PostgreSQL 16 + SQLAlchemy 2.0 (async) + Alembic |
| **Task queue** | Celery + Redis 7 |
| **AI / CV** | face-recognition, dlib, OpenCV, PyTorch (CPU), YOLOv8 (Ultralytics) |
| **Auth** | python-jose (JWT), passlib + bcrypt, slowapi (rate limiting) |
| **Reports / monitoring** | ReportLab, OpenPyXL, Prometheus |
| **Infra** | Docker + Docker Compose, Nginx 1.25 |

---

## 🚀 Getting started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- For local dev: Python 3.11+, Node.js 18+, and `cmake` / `libopenblas-dev` / `libgl1` (for dlib/OpenCV)

### 1. Clone & configure

```bash
git clone <your-repo-url> project-23
cd project-23
cp .env.example .env
```

Edit `.env` and set at least:

```env
SECRET_KEY=<long-random-secret>
POSTGRES_USER=project23_user
POSTGRES_PASSWORD=<strong-db-password>
POSTGRES_DB=project23_db
DATABASE_URL=postgresql+asyncpg://project23_user:<strong-db-password>@localhost:5432/project23_db
```

> **Never commit `.env`** — it is git-ignored. `.env.example` lists every variable with safe placeholders.

### 2. Run the backend with Docker Compose (recommended)

```bash
docker compose up --build -d
```

Starts: `postgres`, `redis`, `app` (FastAPI, internal :8000), `worker` (Celery),
`beat` (Celery scheduler), and `nginx` (public entrypoint on **80 / 443**).
Database migrations run automatically on app startup (`alembic upgrade head`).

```bash
curl -k https://localhost/health     # {"status":"healthy"}
```

> If you rebuild the `app` image, also run `docker compose restart nginx` — Nginx caches the app's
> container IP at start.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The frontend currently uses **mock data** and is not yet wired to the backend API.

### 4. Backend local dev (without Docker)

```bash
python -m venv venv && source venv/bin/activate
# CPU-only torch first (avoids ~2GB of CUDA packages)
pip install torch==2.13.0 torchvision==0.28.0 --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

docker compose up postgres redis -d      # just the data services
alembic upgrade head
uvicorn app.api.main:app --host 0.0.0.0 --port 8000 --reload
# separate terminals:
celery -A app.workers.celery_app worker --loglevel=info
celery -A app.workers.celery_app beat --loglevel=info
```

---

## 🎥 Live webcam demo

A **local-only** tool to see what the detection pipeline reports, using your laptop webcam — no CCTV,
no database writes, no production evidence. Run from the repo root:

```bash
./venv/bin/python -m app.demo.live_webcam          # camera index 0
./venv/bin/python -m app.demo.live_webcam --window-check   # GUI check, no camera
```

Green boxes = person detected (normal); red boxes = a violation (phone / eye-closure sleeping).
Screenshots are saved only to **`demo_evidence/`** (git-ignored; may contain faces). Press `q` / `Esc`
to quit. Full guide: **[docs/live_webcam_demo.md](docs/live_webcam_demo.md)**.

---

## 🔌 API overview

All REST endpoints are under `/api/v1`. Interactive docs at **`/docs`** (Swagger) and **`/redoc`**.
All non-auth routes require a Bearer **access** token; each is guarded by a role
(**ADMIN / OPERATOR / VIEWER**). Employees are monitored records, not login users.

| Module | Endpoints (examples) |
|---|---|
| **Auth** | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| **Employees** | `GET/POST /employees`, `GET/PUT/DELETE /employees/{id}`, `POST /employees/{id}/photo`, `GET /employees/{id}/photo` |
| **Departments** | `GET/POST /departments`, `GET/PUT/DELETE /departments/{id}` |
| **Cameras** | `GET/POST /cameras`, `GET/PUT/DELETE /cameras/{id}`, `POST /cameras/{id}/start|stop`, `GET /cameras/{id}/snapshot` |
| **Attendance** | `GET /attendance`, `GET /attendance/today`, `GET /attendance/employee/{id}`, `PUT /attendance/{id}` (admin override) |
| **Activities** | `GET /activities`, `PUT /activities/{id}/resolve` |
| **Evidence** | `GET /evidence`, `GET /evidence/{id}/screenshot` |
| **Alerts** | `GET /alerts`, `PUT /alerts/{id}/acknowledge` |
| **Reports** | `POST /reports/attendance|activity|incidents`, `GET /reports/jobs/{id}`, `GET /reports/download/{filename}` |
| **Dashboard** | `GET /dashboard/stats`, `/dashboard/cameras`, `/dashboard/attendance/live`, `/dashboard/alerts/recent` |

### WebSocket streams (require `?token=<access-token>`)

| Stream | URL |
|---|---|
| Camera live feed | `wss://<host>/ws/stream/{camera_id}` |
| Alert stream | `wss://<host>/ws/alerts` |
| Attendance stream | `wss://<host>/ws/attendance` |

---

## 🧪 Testing

```bash
./venv/bin/python -m pytest tests/ -q     # 141 tests
```

Covers authentication, role authorization, input validation & path-traversal, attendance-concurrency
(real-PostgreSQL), and the webcam demo (mocked camera/window/pipeline).

---

## 🔒 Security

- **JWT auth** — access & refresh tokens; `get_current_user` rejects a refresh token used as an access token; logout revokes tokens via a Redis blocklist.
- **Authorization** — ADMIN / OPERATOR / VIEWER enforced server-side on the **database** role, not the token claim (no privilege escalation by tampering).
- **Rate limiting** — `SlowAPIMiddleware` enforces a global default (100/min per IP); `/auth/login` is limited to 5/min; login timing is equalised to prevent username enumeration.
- **CORS** — explicit allow-list from `CORS_ALLOWED_ORIGINS` (no wildcard with credentials).
- **WebSockets** — all streams require a valid access token.
- **Validation** — bounded pagination, parameterised queries, content-verified image uploads with server-generated filenames, and clean error responses (no stack traces / secrets).
- **Secrets** — `.env` is git-ignored; `DEBUG` defaults to `False`; Postgres/Redis host ports bind to `127.0.0.1` only.

> ⚠️ Dev notes: the Postgres/Redis `127.0.0.1` port mappings and the self-signed TLS cert are for local
> development — remove/replace them for a real deployment. Always use a fresh, strong `SECRET_KEY` and
> database password.

---

## 🐳 Docker services & volumes

| Service | Image | Port | Notes |
|---|---|---|---|
| postgres | `postgres:16-alpine` | `127.0.0.1:5432` | data in named volume `postgres_data` |
| redis | `redis:7-alpine` | `127.0.0.1:6379` | broker + token blocklist |
| app | `./Dockerfile` | 8000 (internal) | behind Nginx |
| worker | `./Dockerfile.worker` | — | Celery worker |
| beat | `./Dockerfile.worker` | — | Celery scheduler |
| nginx | `nginx:1.25-alpine` | **80, 443** | public entrypoint |

| Host path | Container path | Purpose |
|---|---|---|
| `./media` | `/app/media` | employee photos & evidence (git-ignored) |
| `./models` | `/app/models` | AI model weights (git-ignored) |
| `./logs` | `/app/logs` | application logs (git-ignored) |

> **Safe to stop:** `docker compose stop` or `docker compose down` keep your data.
> **Do NOT run** `docker compose down -v` — it deletes the database volume.

---

## 🔑 Key environment variables

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | JWT signing secret (**required**, change in production) | — |
| `DEBUG` | Debug logging + SQL echo | `False` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed browser origins | `http://localhost:5173,http://localhost:4173` |
| `DATABASE_URL` | Async PostgreSQL URL | — |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | DB credentials used by the containers | — |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | Token TTLs | `30` / `7` |
| `MEDIA_PATH` | Base path for uploaded files & evidence | `./media` |
| `MAX_UPLOAD_SIZE_MB` | Max upload size | `10` |
| `FACE_RECOGNITION_TOLERANCE` / `FACE_RECOGNITION_MODEL` | Match sensitivity / `hog`\|`cnn` | `0.55` / `hog` |
| `LATE_THRESHOLD_MINUTES` / `ATTENDANCE_COOLDOWN_MINUTES` | Attendance tuning | `15` / `5` |
| `EVIDENCE_RETENTION_DAYS` | Evidence cleanup window | `90` |

See `.env.example` for the complete list.

---

## 📄 License

This project is private. All rights reserved.

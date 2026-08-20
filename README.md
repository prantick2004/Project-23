# 🧠 Project-23 — AI-Powered Smart Employee Monitoring & Attendance System

> A production-ready, full-stack backend system for automated employee attendance tracking using **facial recognition**, real-time camera streams, and intelligent alerting — built with **FastAPI**, **PostgreSQL**, **Celery**, and **Docker**.

---

## ✨ Features

- 🎭 **Face Recognition Attendance** — Automated check-in/check-out via live camera feeds using `face_recognition` + `dlib`
- 📷 **Multi-Camera Management** — Register, stream, and manage multiple IP/webcam sources with real-time WebSocket feeds
- 👥 **Employee & Department Management** — Full CRUD with photo upload, shift scheduling, and department grouping
- 📊 **Dashboard & Reports** — Real-time attendance stats, exportable Excel/PDF reports via Celery background tasks
- 🚨 **Alert System** — Configurable alerts for anomalies (unauthorized access, late arrivals, etc.) streamed via WebSocket
- 🔐 **JWT Authentication** — Secure access & refresh token flow with role-based access control
- 🛡️ **Evidence Storage** — Screenshot and video clip evidence linked to attendance and activity events
- 📈 **Prometheus Metrics** — Built-in monitoring via `/metrics` endpoint
- ⚡ **Rate Limiting** — Per-IP rate limiting (100 req/min default) via `slowapi`
- 🐳 **Fully Dockerized** — Multi-service Docker Compose setup with Nginx reverse proxy

---

## 🏗️ Architecture

```
Project-23/
├── app/
│   ├── api/                    # FastAPI layer
│   │   ├── main.py             # Application entry point
│   │   ├── dependencies.py     # Shared DI (auth, DB sessions)
│   │   ├── routers/v1/         # REST API routes (auth, employees, departments, cameras, attendance, alerts, reports, dashboard)
│   │   └── websockets/         # WebSocket streams (camera, alert, attendance)
│   ├── core/                   # Config, logging, constants
│   ├── domain/                 # Domain entities & business rules
│   ├── application/            # Use-case / application layer
│   ├── services/               # Business logic services
│   ├── repositories/           # SQLAlchemy async DB repositories
│   ├── schemas/                # Pydantic request/response schemas
│   ├── infrastructure/
│   │   ├── ai/                 # AI model registry (YOLO, face recognition)
│   │   ├── camera/             # Camera stream manager & main loop
│   │   ├── database/           # SQLAlchemy models & connection
│   │   └── storage/            # Local file storage service
│   └── workers/                # Celery tasks & beat scheduler
├── migrations/                 # Alembic migration scripts
├── scripts/                    # Utility/entrypoint shell scripts
├── docker/                     # Nginx config & TLS certs
├── models/                     # AI model weights (mounted volume)
├── storage/                    # Uploaded files & evidence (mounted volume)
├── logs/                       # Application logs (mounted volume)
├── Dockerfile                  # FastAPI app image
├── Dockerfile.worker           # Celery worker image
└── docker-compose.yml          # Full stack orchestration
```

---

## 🔌 API Overview

All REST endpoints are prefixed with `/api/v1`.

| Module         | Endpoints                                      |
|----------------|------------------------------------------------|
| **Auth**       | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| **Employees**  | `GET/POST /employees`, `GET/PUT/DELETE /employees/{id}`, `POST /employees/{id}/photo` |
| **Departments**| `GET/POST /departments`, `GET/PUT/DELETE /departments/{id}` |
| **Cameras**    | `GET/POST /cameras`, `GET/PUT/DELETE /cameras/{id}`, start/stop stream |
| **Attendance** | `GET /attendance`, `GET /attendance/{id}`, manual override |
| **Activities** | `GET /activities` — employee activity logs |
| **Evidence**   | `GET /evidence` — screenshots & clips |
| **Alerts**     | `GET /alerts`, acknowledge alerts |
| **Reports**    | `POST /reports/generate`, `GET /reports/{id}/download` |
| **Dashboard**  | `GET /dashboard/stats` — real-time KPIs |

### WebSocket Streams

| Stream              | URL                              |
|---------------------|----------------------------------|
| Camera live feed    | `ws://<host>/ws/camera/{id}`     |
| Alert stream        | `ws://<host>/ws/alerts`          |
| Attendance stream   | `ws://<host>/ws/attendance`      |

Interactive API docs available at **`/docs`** (Swagger UI) and **`/redoc`**.

---

## ⚙️ Tech Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| **API Framework**  | FastAPI 0.111 + Uvicorn                         |
| **Database**       | PostgreSQL 16 + SQLAlchemy 2.0 (async)          |
| **Migrations**     | Alembic                                         |
| **Task Queue**     | Celery 5.4 + Redis 7 (broker & result backend)  |
| **AI / CV**        | face-recognition, dlib, OpenCV, PyTorch, YOLO (Ultralytics) |
| **Auth**           | python-jose (JWT), passlib + bcrypt             |
| **Validation**     | Pydantic v2                                     |
| **Reports**        | ReportLab (PDF), OpenPyXL (Excel)               |
| **Monitoring**     | Prometheus + prometheus-fastapi-instrumentator  |
| **Rate Limiting**  | slowapi                                         |
| **Reverse Proxy**  | Nginx 1.25                                      |
| **Containerization**| Docker + Docker Compose                        |

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/) installed
- (For local dev) Python 3.11+, `cmake`, `libopenblas-dev`, `libgl1`

---

### 1. Clone & Configure

```bash
git clone <your-repo-url> project-23
cd project-23

# Copy and fill in your environment variables
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
SECRET_KEY=<your-long-random-secret>
POSTGRES_USER=project23_user
POSTGRES_PASSWORD=<your-db-password>
POSTGRES_DB=project23_db
```

---

### 2. Run with Docker Compose (Recommended)

```bash
docker compose up --build -d
```

This starts:
- `postgres` — PostgreSQL database
- `redis` — Redis broker
- `app` — FastAPI application (port 8000, internal)
- `worker` — Celery worker
- `beat` — Celery beat scheduler
- `nginx` — Reverse proxy on ports **80** and **443**

**Check health:**

```bash
curl http://localhost/health
```

---

### 3. Run Locally (Development)

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL and Redis (via Docker or locally)
docker compose up postgres redis -d

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.api.main:app --host 0.0.0.0 --port 8000 --reload

# Start Celery worker (in a separate terminal)
source venv/bin/activate
celery -A app.workers.celery_app worker --loglevel=info

# Start Celery beat scheduler (in another terminal)
source venv/bin/activate
celery -A app.workers.celery_app beat --loglevel=info
```

---

## 🗃️ Database Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "describe your change"

# Rollback one migration
alembic downgrade -1
```

---

## 🔒 Environment Variables

| Variable                     | Description                                    | Default |
|------------------------------|------------------------------------------------|---------|
| `APP_NAME`                   | Application name                               | `Project-23` |
| `APP_VERSION`                | Application version                            | `1.0.0` |
| `DEBUG`                      | Enable debug mode                              | `True` |
| `SECRET_KEY`                 | JWT signing secret (**change in production!**) | — |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Access token TTL                               | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS`  | Refresh token TTL                              | `7` |
| `DATABASE_URL`               | Full async PostgreSQL URL                      | — |
| `REDIS_URL`                  | Redis connection URL                           | `redis://localhost:6379/0` |
| `STORAGE_PATH`               | Path for uploaded files                        | `./storage` |
| `MAX_UPLOAD_SIZE_MB`         | Max file upload size                           | `10` |
| `FACE_RECOGNITION_TOLERANCE` | Face matching sensitivity (lower = stricter)   | `0.55` |
| `FACE_RECOGNITION_MODEL`     | `hog` (CPU) or `cnn` (GPU)                    | `hog` |
| `ENCODING_CACHE_SIZE`        | In-memory face encoding cache limit            | `1000` |
| `LATE_THRESHOLD_MINUTES`     | Minutes after shift start to flag as late      | `15` |
| `ATTENDANCE_COOLDOWN_MINUTES`| Minimum gap between attendance records         | `5` |
| `EVIDENCE_RETENTION_DAYS`    | Days to keep evidence files before cleanup     | `90` |
| `EMAIL_ENABLED`              | Enable email notifications                     | `False` |
| `SMS_ENABLED`                | Enable SMS notifications                       | `False` |

---

## 📦 Key Services

### Face Encoding Service
Loads and caches face encodings from the database at startup. Re-triggered when employee photos are updated.

### Camera Stream Manager
Manages concurrent camera threads with start/stop lifecycle hooks. Passes frames through the AI pipeline for face detection, attendance logging, and evidence capture.

### Report Tasks (Celery)
Background tasks for generating attendance and activity reports in Excel/PDF format, available for async download.

---

## 📊 Monitoring

- **Health check**: `GET /health`
- **Prometheus metrics**: `GET /metrics`
- **API docs**: `GET /docs` (Swagger), `GET /redoc`

---

## 🐳 Docker Services

| Service   | Image                   | Port (Internal) | Notes                         |
|-----------|-------------------------|-----------------|-------------------------------|
| postgres  | `postgres:16-alpine`    | 5432            | Exposed to host in dev mode   |
| redis     | `redis:7-alpine`        | 6379            | Internal only                 |
| app       | `./Dockerfile`          | 8000            | Behind Nginx                  |
| worker    | `./Dockerfile.worker`   | —               | Celery worker                 |
| beat      | `./Dockerfile.worker`   | —               | Celery beat scheduler         |
| nginx     | `nginx:1.25-alpine`     | **80, 443**     | Public entrypoint             |

---

## 📁 Volume Mounts

| Host Path    | Container Path      | Purpose                          |
|--------------|---------------------|----------------------------------|
| `./storage`  | `/app/storage`      | Employee photos & evidence files |
| `./models`   | `/app/models`       | AI model weights                 |
| `./logs`     | `/app/logs`         | Structured application logs      |

---

## 🛡️ Security Notes

- All media files are served through authenticated API endpoints (not as public static files)
- JWT-based auth with configurable expiry for both access and refresh tokens
- Rate limiting enabled globally at 100 req/min per IP
- Non-root Docker user (`appuser`) for the application container
- **Do not expose PostgreSQL port (5432) in production** — remove the `ports` mapping in `docker-compose.yml`

---

## 📄 License

This project is private. All rights reserved.

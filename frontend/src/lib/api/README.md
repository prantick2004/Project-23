# Future backend integration point

This folder is intentionally empty of network calls for the current frontend-only phase.

When the Python backend (FastAPI, see `app/api/routers/v1/*.py`) is ready to connect:

1. Add a base client here (e.g. `client.ts`) wrapping `fetch`/`axios` with the backend base URL.
2. Each `features/*/**-service.ts` file currently returns mock data synchronously/async from
   `src/lib/mock-data/*`. Swap the internals of those functions to call this client instead —
   the function signatures are designed to stay the same so UI components require no changes.
3. Wire real JWT auth (see `app/api/routers/v1/auth.py`) into `features/auth/auth-service.ts`.
4. Wire WebSocket camera/alert/attendance streams (see `app/api/websockets/*.py`) into
   `features/cameras/camera-service.ts` and `features/alerts/alert-service.ts`.

No endpoint paths, payload shapes, or auth schemes are assumed here — connect manually after
verifying the backend contract.

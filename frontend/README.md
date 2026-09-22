# nit Solution — Frontend (Demo Build)

Premium frontend-only demo for the nit Solution CCTV employee monitoring & multi-store
management platform. Built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion,
Recharts, and Lucide icons.

## This is frontend-only

No backend, database, WebSocket, or real authentication is connected. All data comes from
`src/lib/mock-data/`. Every screen that shows mock data is labeled with a demo banner.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Structure

- `src/app` — routes (public pages, `/login`, `/admin/*`, `/employee/*`)
- `src/components` — layout, navigation, dashboard, forms, tables, charts, cameras, ui
- `src/features/*/**-service.ts` — mock-backed service functions; swap internals here to
  call your real Python backend later without touching UI components
- `src/lib/mock-data` — all demo data lives here
- `src/lib/api/README.md` — notes on connecting the FastAPI backend when ready
- `src/types` — shared TypeScript interfaces

## Pages included

Public: Home, About, Features, Reports (overview), Contact, Login (Admin/Employee tabs +
employee registration).

Admin (`/admin/*`): Dashboard, Employee Management, CCTV Monitoring, Store Management,
Attendance, Activities, Alerts, Reports, Settings.

Employee (`/employee/*`): Dashboard, Profile, Attendance, Activities.

## Connecting the real backend later

See `src/lib/api/README.md`. In short: add a client under `src/lib/api/`, then update each
`features/*/**-service.ts` to call it instead of returning mock data — component code does
not need to change.

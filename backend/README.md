# CampusOne backend

This is the matching Node/TypeScript backend for the CampusOne frontend. It follows the frontend contract already used by the Next.js app, especially the session and auth endpoints expected by the mobile/web clients.

## Why this backend

The frontend is a Next.js + React app and its own API contract expects a Node service with endpoints like:

- `GET /api/health` -> `{ ok: true }`
- `POST /api/auth/token` -> `{ token, expiresAt, user }`
- `GET /api/auth/token` -> `{ user }`
- `DELETE /api/auth/token` -> `{ ok: true }`
- `GET /api/users/me` -> `{ user }`

This backend is designed to satisfy that contract without depending on the legacy PHP scaffold.

## Run locally

```bash
cd backend
npm install
npm run dev
```

The service listens on port `4000` by default.

## Production build

```bash
cd backend
npm install
npm run build
npm start
```

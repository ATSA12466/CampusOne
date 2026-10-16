# CampusOne PHP backend

This backend is a PHP/PostgreSQL implementation for the CampusOne app and follows the frontend contract expected by the current Next.js app.

## Why PHP

The requirement is that the whole app uses a PHP backend. This implementation is built to satisfy that requirement while matching the project API contract, including:

- `GET /api/health` -> `{ "ok": true }`
- `POST /api/auth/token` -> `{ token, expiresAt, user }`
- `GET /api/auth/token` -> `{ user }`
- `DELETE /api/auth/token` -> `{ ok: true }`
- `GET /api/users/me` -> `{ user }`
- `PATCH /api/users/me` -> `{ user }`
- `GET /api/me/store` / `PUT /api/me/store` -> `{ items, total, ... }`

## Setup

1. Copy `.env.example` to `.env`.
2. Create a PostgreSQL database named `campusone`.
3. Make sure the PHP PDO PostgreSQL extension is enabled.
4. Start the PHP server:

```bash
cd backend
php -S 0.0.0.0:4000 -t public
```

## Database schema

The schema is in:

```bash
backend/database/schema.sql
```

This file creates the `users`, `sessions`, and `me_store` tables.

## Notes

This is a PHP backend matching the app’s current contract, rather than the older PHP branch that was not aligned with the frontend.

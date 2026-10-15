# Phase 1 backend scaffold notes

This folder contains a minimal Phase 1 scaffold for the CampusOne PHP API implementing a Postgres-backed JSON REST API.

What is included
- api/bootstrap.php - database connection and basic CORS
- api/helpers.php - JSON helpers, JWT encode/decode helpers
- api/routes.php - minimal router mapping URLs to controllers
- api/src/controllers - controllers for Auth, Users, Announcements, Clubs, Events
- api/db/migrations/0001_initial_schema.sql - Postgres DDL and seed data
- .env.example - environment variable template

How to run locally (Postgres already installed)
1. Create the database and run the migration SQL:
   psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f api/db/migrations/0001_initial_schema.sql
2. Copy .env.example to .env and update values.
3. Start PHP built-in server at repo root:
   php -S 0.0.0.0:8000 -t .
4. Point frontend at the API:
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

Notes and next steps
- Auth uses a simple JWT implementation (HS256) and stores refresh tokens in the DB. Set JWT_SECRET in .env for production.
- OTP and email verification are stubbed; integrate SMTP/SMS providers for full verification flows.
- Role/permission system is basic (role column on users). For Phase 1 we can keep role checks in controllers; later we will add dedicated permissions tables and middleware.
- No Docker Compose requested; use native Postgres and PHP for dev.

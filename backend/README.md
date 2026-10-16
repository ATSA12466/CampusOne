# CampusOne backend

This backend is built for PostgreSQL and uses Drizzle ORM to match the CampusOne frontend contract.

## Why PostgreSQL

The frontend repo already includes a Drizzle/Postgres setup and expects a server-side database-backed API. This backend uses the same model, without depending on the older PHP branch.

## Environment

Copy `.env.example` to `.env` and configure your Postgres instance:

```bash
cp .env.example .env
```

Required values:

```env
PORT=4000
JWT_SECRET=campusone-dev-secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campusone
```

## Run locally

```bash
cd backend
npm install
npm run db:push
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

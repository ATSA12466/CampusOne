# CampusOne

CampusOne is the SRC Student Digital Ecosystem — a unified digital platform for student life, academic support, communities, services, commerce, administration, and media.

It is built around one core idea:

One account. One platform. A connected student experience.

CampusOne brings together academic resources, institutional communication, club and committee management, class representative workflows, productivity tools, campus services, social networking, hostel discovery, marketplace activity, and advertising operations into one system.

## Product vision

CampusOne is not just an SRC app or a single module. It is an integrated ecosystem that helps students manage their academic, social, and administrative life in one place.

Students should be able to:
- check announcements and notifications
- access learning materials and AI study assistance
- manage tasks, timetable, and calendar
- join clubs and communities
- browse events and services
- discover hostel options and student marketplace listings
- report issues, find lost items, and interact with campus services
- participate in the student community through social features and messaging

SRC administration should be able to:
- communicate with the student body
- manage clubs, committees, and class representatives
- monitor attendance and participation
- review reports and issues
- run analytics and student engagement dashboards
- manage admission, verification, media, and community operations

## Core objectives

The platform is designed to achieve six major goals:

1. Academic Support
   - course materials
   - syllabi and slides
   - past questions and assignments
   - timetable and academic announcements
   - AI study assistant

2. SRC Administration
   - student communication
   - representatives and committees
   - clubs and community management
   - events and attendance
   - reports and analytics

3. Student Productivity
   - tasks and reminders
   - calendar planning
   - timetable management
   - study scheduling and deadline tracking

4. Student Community
   - follow and connect with people
   - create posts and media
   - join communities and clubs
   - message and collaborate
   - discover campus opportunities and activities

5. Student Services
   - hostel discovery and verification
   - lost and found
   - event discovery
   - marketplaces and digital products
   - student support workflows

6. Student Media and Advertising
   - campus announcements
   - podcast and short-form media
   - sponsored content and advertiser campaigns
   - analytics and campaign tracking

## Core product areas

- Identity & Access
- Student Dashboard
- Academic Experiences
- SRC Administration
- Clubs & Communities
- Social Network
- Student Services
- Marketplace & Commerce
- Media
- Advertising
- Events & Feedback
- Security & Infrastructure

## Why this project matters

The current student experience is fragmented across WhatsApp groups, university announcements, social pages, hostel ads, informal marketplaces, and multiple disconnected tools. CampusOne brings these experiences together into one connected ecosystem.

We are building a platform that is:
- simple for students
- powerful for administrators
- modular and maintainable
- secure and permission-aware
- scalable for growth
- mobile-first and accessible

## Tech stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- React Hook Form + Zod
- Lucide React

### Backend
- Laravel PHP backend
- PostgreSQL database
- JWT authentication
- JSON REST API
- seeders for demo and admin data
- backend-ready API boundary for future expansion

### Data and platform baseline
- Drizzle ORM / Postgres-ready baseline
- environment-driven configuration
- backend integration files prepared for domain services

## Current status

The frontend prototype is in place and organized with a backend-ready service boundary. The app currently uses demo data in the service layer while the backend architecture is being prepared.

This repository now contains:
- Laravel-ready backend scaffolding
- JWT auth setup
- PostgreScript/Postgres migration scaffolding
- invitation API and migration
- JSON endpoint fixtures for early backend integration
- TypeScript API adapters aligned with the frontend boundary
- demo and admin seeders

## Backend integration model

The frontend is designed to call backend endpoints through the following boundary:

- `src/services/api/client.ts`
- `src/services/api/*.service.ts`
- `NEXT_PUBLIC_API_BASE_URL`

The base URL should point at the PHP/Laravel API root, for example:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

## Project structure

```text
api/
  app/
  bootstrap/
  config/
  database/
  public/
  routes/
  storage/
  tests/
  .env.example
  composer.json

src/
  app/
  components/
  features/
  services/
    api/
    demo/
    auth/
  stores/
  types/
  data/demo/
  config/

public/
  static assets and images

docs/
  architecture and project planning docs

scripts/
  convert_to_laravel.sh
```

## Laravel backend entrypoints

The repository includes the following backend files and structure:

- `api/routes/api.php` — API route definitions
- `api/app/Http/Controllers/` — auth, users, announcements, clubs, events
- `api/database/migrations/` — schema definitions
- `api/database/seeders/` — demo and admin seeders
- `api/.env.example` — environment template

Example routes:
- `GET /api/health`
- `GET /api/clubs`
- `GET /api/clubs/{id}`
- `POST /api/clubs/{id}/join`
- `GET /api/events`
- `GET /api/events/{id}`
- `POST /api/events/{id}/register`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/invitations`
- `GET /api/announcements`

## API contract conventions

The frontend and backend should follow consistent patterns:

- JSON responses only
- ISO timestamps for dates
- consistent error format
- list endpoints return `data` and `meta` when paginated
- auth endpoints return access tokens and user profile
- permissions enforced on the backend

Example success response:

```json
{
  "data": [
    { "id": "club-1", "name": "Code Collective" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

Example error response:

```json
{
  "error": "Unauthorized",
  "code": "AUTH_REQUIRED"
}
```

## Core user roles

- General User
- Verified Student
- Class Representative
- Club Member
- Club Executive
- Committee Member
- SRC Executive
- Platform Administrator
- Vendor
- Advertiser

## Core domain model

The project spans the following domains:

- Identity
- Academic
- Productivity
- Community
- Social
- Services
- Marketplace
- Media
- Advertising
- Administration
- Security and infrastructure

## Development roadmap

### Phase 0: Discovery and Foundation
- finalize requirements
- define user roles and permissions
- define verification process
- design database and system architecture
- define MVP and UI system

### Phase 1: Core Platform
- authentication and student verification
- profile and dashboard
- announcements and notifications
- learning materials
- class representative portal
- tasks, timetable, and calendar
- admin dashboard

### Phase 2: Community Management
- clubs
- committees
- attendance
- reports
- recognition
- events

### Phase 3: Student Services
- hostel discovery
- lost and found
- freshers hub
- event discovery
- student directory

### Phase 4: Social Platform
- feed
- following
- posts and media
- messaging
- moderation and safety

### Phase 5: Media
- podcasts
- short-form video
- creator profiles
- analytics

### Phase 6: Commerce
- online shop
- marketplace
- digital products
- orders and payments

### Phase 7: Advertising
- campaigns
- sponsored listings
- analytics
- advertiser dashboards

### Phase 8: Intelligence and Optimization
- recommendations
- AI-powered scheduling
- content personalization
- administrative analytics

## Key product principles

1. Simple for students
2. Powerful for administrators
3. Modular and independent
4. Secure by design
5. Scalable for growth
6. Mobile-first
7. Data-driven
8. Moderated and safe
9. Transparent and auditable
10. Extensible for future features

## Security and architecture standards

CampusOne must enforce security on the backend, not only in the frontend. This includes:
- secure authentication
- password hashing
- OTP and verification
- role-based access control
- session management
- audit logging
- rate limiting
- secure file storage and access control
- cloud-ready infrastructure

## Local development

### Frontend
```bash
npm install
npm run dev
```

### Laravel backend
```bash
cd api
cp .env.example .env
composer install
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000
```

Then point the frontend at the backend:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

## Environment variables

### Frontend
- `NEXT_PUBLIC_API_BASE_URL`

### Laravel backend
- `DB_CONNECTION`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- SMTP / SMS placeholders for provider configuration

## Default admin account

The seeded admin account for local testing is:

- Email: `godword29@gmail.com`
- Password: `Godwordsolomon`

Change this immediately in production or after first login.

## Notes

The project is intentionally built in phases. The platform is large, and the first safe release should focus on the core student experience and essential administration functions before adding heavier social, commerce, and media functionality.

The master product specification remains the final reference for scope, feature design, and roadmap decisions.

## Final product vision

CampusOne should become the digital infrastructure connecting students to their academic life, social life, campus services, communities, media, commerce, and SRC administration.

A student should be able to start the day by checking classes, tasks, announcements, calendar, and opportunities, then continue through learning, messaging, events, hostel discovery, marketplace activity, and campus social engagement — all under one account and one platform.

At the same time, the SRC should be able to organize, communicate, monitor, support, and report on student life using one connected system.

That is the full CampusOne scope.

---

This repository is under active product and backend integration development for the CampusOne Student Digital Ecosystem.

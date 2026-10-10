# API_INTEGRATION_GUIDE

## Frontend integration posture
CampusOne separates demo adapters from backend-ready API utilities.

## Existing API boundary
- Base URL: `NEXT_PUBLIC_API_BASE_URL`
- Shared fetch utility: `src/services/api/client.ts`
- Demo adapters: `src/services/demo/*`
- Auth abstraction: `src/services/auth/demo-auth.service.ts`

## Integration approach with PHP backend
1. Add API domain services (`src/services/api/<domain>.service.ts`)
2. Keep feature component contracts stable
3. Replace demo-service imports module-by-module
4. Keep demo fallback available for local frontend-only testing

## Suggested endpoint group alignment
- `/auth`
- `/users`
- `/resources`
- `/tasks`
- `/timetable`
- `/clubs`
- `/participation`
- `/src-office`
- `/announcements`
- `/events`
- `/community`
- `/messages`
- `/notifications`
- `/opportunities`
- `/marketplace`
- `/lost-found`
- `/accommodation`
- `/media`
- `/advertising`

## Required backend decisions before full integration
- Final auth/session strategy and token lifecycle
- Role/permission matrix per management action
- Attachment/file storage contract
- Notification delivery model
- Pagination, sorting, and filtering contract consistency
- Event ticket verification authority
- Source of truth for official academic timetable data

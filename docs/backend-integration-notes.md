I updated the frontend-backend integration by:

- Adding a lightweight PHP API router at api/index.php that serves JSON fixtures for key domains and delegates invitations to api/invitations.php.
- Adding JSON fixtures under api/data/ for engagement (clubs, announcements, events, opportunities), home (featured), life/marketplace (marketplace listings, accommodations), productivity/timetable (sessions & tasks), and community (conversations/posts/notifications).
- Implementing async API service adapters under src/services/api/ that call the PHP fixtures via the existing api client (`src/services/api/client.ts`).

Next steps / notes for switching frontend to the PHP API
- The added API services are async and return Promises; many existing demo services are synchronous. To migrate a feature to the backend, update its imports from `@/services/demo` to `@/services/api` and await calls where necessary or move calls into client components / server components that support async.
- Example: For client components (those starting with `"use client"`), replace demo imports and call the API inside useEffect or event handlers. For server components or page-level code, you can `await` the new API service methods in async server components.

If you want, I can:
1) Replace selected features (client-side ones) to use the new API services now so the frontend fetches live data from the PHP backend fixtures.
2) Convert the MySQL invitations migration to Postgres if you prefer Postgres.
3) Implement more API endpoints and richer fixtures.

How I tested locally (recommendation)
- Set NEXT_PUBLIC_API_BASE_URL to your running PHP server e.g. `http://localhost:8000/api` and open the frontend. Replace feature imports to `@/services/api` to see backend-powered data.


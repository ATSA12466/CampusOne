# Phase 6K — Community, Messages and Notifications

Verified frontend milestone, 11 October 2026. Existing URLs remain `/community`, `/messages` and `/notifications`. This is a labelled prototype, not an official campus communications service.

## Shipped

- Photo-led Community with server-read public stories, a bounded first 30 records, six/page, loaded-record search, All / Your private updates / Your reactions and honest supplied counts. Fictional author initials replace a misleading shared portrait. Twelve illustrative public posts preserve `p1` / `p2`.
- Owner-private text/topic/photo updates, idempotent desired like state, private threaded replies (including parent references), concern drafts and own-update deletion. Prepared owned JPEG/PNG/WebP attachments reuse the existing crop/compression/validation pipeline.
- Source-qualified Messages: six supplied previews preserving `c1` / `c2`, search, URL-selected thread, private conversation creation, ordered message history, attachments and reload persistence. No invented online presence, typing, real delivery or read receipts.
- Twelve illustrative Notifications preserving `n1` / `n2`; category/unread filters, six/page, read and read-all. Demo read state uses the canonical store so the same-profile header updates. Guests/API identities no longer receive seeded demo unread counts.
- Feature modules are split near the requested 150-line size. No runtime dependency, new static image or animation library was added. Semantic light/dark, reduced motion, existing next/font pairing and accessible primitives are retained.

## Privacy, persistence and limits

The six new workspace collections are `communityPosts`, `replies`, `reactions`, `concerns`, `messages` and `conversations`. Keys include source, encoded account ID and lowercased email. Live role/source/owner changes invalidate accepted results; stale/aborted hook mutations cannot falsely report success. Successful server writes cannot be undone merely by cancelling a browser request.

Local storage is bounded to 200 records / 3,000,000 serialized characters per collection, with a clear rejection rather than silently dropping older data. Prepared photo strings are bounded to 720,000 characters. Denied writes retain newer in-memory, visit-only data even when older durable data exists. External storage events invalidate memory snapshots, so a second tab's deletion cannot resurrect old posts. Corrupt data is reported, not silently overwritten. Failed durable cleanup contributes to the sign-out storage warning. Notifications verify their stored read-state snapshot rather than assuming that a store update reached durable storage.

Demo records are private to this device/profile. API records belong to the connected service; neutral workspace labels avoid claiming they are device-local. Saving a concern does **not** prove moderator review or contact emergency services. Creating a conversation does **not** invite a real contact. Demo photo covers and people are generated illustrations, not actual GCTU activity.

## Proposed service boundary

`workspaceService` remains a lazy typed facade. Proposed cookie-authenticated operations are:

- `GET /workspace/{collection}` → `{ items: validatedRecords[] }`.
- `PUT /workspace/{collection}/{id}` with the complete typed record → `{ ok: true }`.
- `DELETE /workspace/{collection}/{id}` → `{ ok: true }`.
- `PUT /notifications/read` with `{ ids: string[] }` → `{ ok: true }`; IDs are validated/bounded to 200, writes use no-store, credentials and a ten-second signal.

Public posts extend the catalog DTO with optional `{ details: { topic, cover? } }`; bodies, ISO dates, IDs and nonnegative activity counts are validated. Conversation IDs are validated; notification destinations follow the existing student path-only return allowlist. Browser requests stay relative to `/api`, with the server-only proxy targeting port 4000.

These are frontend contracts, **not deployed backend evidence**. A real publisher must enforce identity/ownership/RBAC, CSRF protections, authorization for every read and write, safe uploads, storage retention/deletion, notification ownership, moderation and realtime messaging. Demo desired reactions/replies are not a public broadcast API. API browser integration will be checked with controlled fixtures during final verification; actual deployment remains external.

## Executed verification

- `npm run lint`, `npm run typecheck`, optimized `npm run build`: passed.
- Existing nine-script regression: 176/176 native tests passed; independent `npm run test:social`: 10/10 passed. The fresh ten-suite full sweep is 186/186.
- `node scripts/phase6-social-audit.mjs`: **46 production captures**, clean exit. Three screens × 360/768/1280 × light/dark; mobile/desktop workflow states plus guest, denied-storage and corrupt-storage cases. No automated AA violations, document overflow, visible offscreen content or sub-44px controls in those captures; tracked workflow page exceptions were empty.
- Verified invalid post, owned photo preparation, post reset/reload, desired like toggling, reply/nested reply, concern draft, real second-tab removal, empty search, private thread, message/photo/reset/reload, notification read/read-all/reload and guest gates. Manual review covered each screen at 360/1280 in light/dark and both message/photo layouts.
- Native schemas/canonical fixture IDs, owner separation, idempotency, notification denied persistence, late API role change, capacity rejection, cleanup failure, cross-tab deletion, newer volatile data and credentialed/no-store notification API acknowledgements/role/abort bounds.

Ignored evidence: `.cache/phase6/social/{native,native-all,build,browser}.log`, `browser/checks.json` and PNGs. Screenshots are reproducible tooling, not committed artifacts. Automated AA checks do not replace real assistive-technology/device testing.

Next: Study Assistant/Tasks, SRC/announcements/participation/media/management/advertising/settings, global polish and final verification. Home's standard-renderer/physical-device Performance ≥90 gate and authorized SRC artwork remain open, alongside real backend/security/transport.

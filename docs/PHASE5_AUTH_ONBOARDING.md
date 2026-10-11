# Phase 5 — photo-led authentication and onboarding

11 October 2026 · `campusone-web` · **Frontend milestone, not a secure authentication deployment.**

The established magazine direction now covers `/sign-in`, `/register`, `/forgot-password` and all five `/onboarding` steps. URLs, Manrope/Fraunces fonts, semantic themes and the pending official SRC artwork slot are retained. Photographs come from the existing centralized, clearly fictional generated-image registry; no new asset or runtime library was needed.

## Experience and honest outcomes

- **Sign-in:** normalized email, a made-up preview password, reveal/hide, remember-profile choice, and a clearly demo-only role switch. The local adapter accepts valid demo input; it does **not** verify a password or create an official session. Never enter a real campus password.
- **Register:** meaningful Unicode name, normalized email, 8–128-character preview password, confirmation and explicit demo acknowledgment. The submitted name/email actually create a new `local-…` student profile, instead of discarding them for the seeded student. A new registration uses its newly submitted name even if a previous local profile had the same email.
- **Recovery:** validated email and request states. Demo success explicitly says **no email was sent**. API acceptance is a request, not a guarantee of mailbox delivery.
- **Introduction:** welcome → study → belonging → representation → profile. Skip, Back, Continue, persisted position, replay, and return to the originating student route are functional. Name/programme/level, three portrait choices and optional interests are saved locally. Programme choices are illustrative; interests do not yet drive recommendation feeds.
- **Photo:** an optional, intent-loaded editor reuses the foundation uploader. JPEG/PNG/WebP validation, crop, preview and bounded local compression work. The resulting avatar survives client navigation for this visit, but is omitted from storage and disappears on reload. There is no server upload.

Fields use React Hook Form + Zod with inline errors, error association and first-invalid-field focus. Submission has a duplicate guard, disabled pending action and explicit cancellation; abort/sequence checks ignore stale completions. A service/code failure retains inputs and provides truthful resubmit or reconnect/save/reload guidance. Photos are SSR-visible with reserved geometry; the narrow layout puts the photo story before the form rather than hiding it.

The photo background and editorial copy must share a frame. Explicit absolute/full-size image utilities and `.auth-story-content { min-height: inherit }` prevent inherited portrait/min-height utilities from stacking the image above its text. The browser audit asserts image/copy bounds in all six responsive/theme combinations; width metrics alone did not catch the original visual defect.

## Hydration, return paths and privacy

`SessionBootstrap` performs explicit auth/onboarding hydration before the first-visit guard decides. It restores an API session only from the cookie endpoint; failed/unconfirmed API sessions clear local activity and never substitute a demo account. Intro completion is **not** an authentication or authorization guard.

`studentReturnPath()` accepts only existing student roots/detail patterns. External/protocol-relative links, query/hash destinations, controls, traversal/double encoding and auth loops fall back to `/home`. The tour retains the safe originating destination through completion or skip. No URL was renamed.

| State | Persistence / behavior |
| --- | --- |
| `campusone-auth` | Whitelisted demo profile fields/source/remember only; never password, token, file, data URL or blob URL. API identity/role is not restored as proof of authentication. |
| `campusone-onboarding` | Sanitized completion, bounded step 0–4 and local preferences; legacy completion migrates. Valid profile drafts survive Back. |
| `campusone-app` | Existing local task/bookmark/membership/registration/notification/SRC-request activity; account changes and logout clear private collections. |
| Prepared photo | Owned object URL in visit memory; replacement, account change and logout revoke it. |
| Denied storage | Auth/tour fall back to memory with an explicit notice; durable removal cannot be guaranteed when browser storage refuses access. |

Missing auth storage preserves the seeded **Ama Nyarko** preview for compatibility. Explicit stored-null/logout/remember-disabled state remains guest, including reload; it does not resurrect Ama. A remembered returning demo sign-in retains that local profile. Source/identity changes isolate private activity; a role change for the same demo student deliberately retains executive requests/approvals.

Sign-out clears user/elevated role, six private activity arrays, personalization and the prepared photo. Demo tabs synchronize account changes, explicit logout and external storage clearing. API cross-tab/session revocation is a backend integration concern, not certified by that demo test. Invalid saved JSON clears the account and leaves visible recovery guidance. Remember-disabled identity is visit-only; anonymous reload clears associated private activity.

On an API sign-out failure/cancel, local state is still cleared but the UI does **not** claim the server session ended; it asks the user to retry before leaving a shared device. When storage cannot be cleared, a notice warns that previous saved data might reappear after access returns.

## Replacement boundaries

- `src/types/auth.ts`: typed `AuthService`, session/request/options/reset-result, onboarding/preferences and local-photo contracts.
- `src/services/auth/auth.service.ts`: lazy source selection from `NEXT_PUBLIC_DATA_SOURCE`; no UI dataset imports.
- `demo-actions.service.ts`: explicitly local demo outcomes; passwords are not retained.
- `api-auth.service.ts`: proposed cookie endpoints, validated DTOs, `credentials: include`, `no-store`, 10-second abort deadlines and caller cancellation. Backend role comes from the response; client role/confirmation/acknowledgment are never sent as authorization.
- `services/profile/`: cloned demo personalization preserving identity/role, and owned local photo URL lifecycle. API mode saves local preferences without claiming to update an official profile.
- `lib/auth/`: narrow redirects, stored-profile reconstruction and safe memory/storage handling.

| Proposed endpoint (browser prefix `/api`) | Request | Response |
| --- | --- | --- |
| `POST /auth/sign-in` | `{ email, password }` | `{ user: UserProfile }` + backend cookie |
| `POST /auth/register` | `{ name, email, password }` | `{ user: UserProfile }` + backend cookie |
| `POST /auth/password-reset` | `{ email }` | `{ accepted: true }` |
| `GET /auth/session` | Cookie credentials | `{ user: UserProfile \| null }`; 401 is signed-out |
| `POST /auth/sign-out` | Cookie credentials | 204 or `{ ok: true }` |

`UserProfile` includes id, name, email, validated role, programme, level and optional approved avatar URL. Browser requests remain same-origin and Next proxies to platform **4000**. Endpoint paths/envelopes are proposals tested with mocked fetch, **not** a deployed backend. Password hashing, TLS/secure cookies, server role enforcement, CSRF, throttling, abuse protection, account uniqueness, verification/MFA, reset tokens/email delivery, private profile updates and uploads must be agreed and verified with the real server. If registration needs verification rather than immediately yielding a session, extend the typed outcome/UI; do not fabricate authentication.

## Verification and remaining scope

- Lint, strict TypeScript, optimized Next **16.4.0** production build and **68 native tests** pass (15 foundation + 12 shell + 18 Home + 23 auth).
- Six auth browser groups pass: forms, tour, photo, session, feedback/storage and delivery; **105 AA/layout/44px captures**. Each principal form, intro and editor is checked at 360/768/1280 in light/dark.
- Keyboard trap/Escape/return, password toggles, validation focus, safe destination, actual registration identity, progress/replay/drafts, prepared avatar navigation/reload, failure/resubmit/cancel, denied/corrupt storage, remember/logout/multitab/private-state isolation and preserved executive approval are exercised.
- Editor code is absent until intent; cancellation prevents late delivery from opening it. A persistent blocked chunk recovers through reload. The auth photo renders without hydration.
- Shared foundation, shell/search, Home/media and preserved workflows are rechecked; 222 route cases / 74 route AA checks have zero layout/target flags. The first-visit and sign-out gaps recorded in Phase 1 are now closed.

See [TEST_REPORT.md](TEST_REPORT.md) for exact evidence, renderer-disclosed Lighthouse medians and residual dependency/device/backend gaps. Home Accessibility is 100; default-renderer Performance ≥90 remains open. Phase 6 begins with photo-rich Clubs/Events and then the ordered domain migrations. Existing community/lost-found persistence, required report photos, study constraints, 12–30-item feeds and domain detail depth remain feature work.

# Feature inventory — current frontend

**Phases 1–7 are implemented and Phase 8 frontend verification is complete.** The ordered feature migrations through 6M, source-safe polish, responsive/theme review and production lab targets are complete. This is a clearly labelled demo/application frontend, **not a deployed official GCTU/SRC platform**. See [final handoff](FINAL_HANDOFF.md) and the [compact evidence](audits/final-summary.json) for current results; individual phase documents preserve historical scope and measurements.

## Implemented experiences

| Area | Current frontend capability | Authority / source boundary |
| --- | --- | --- |
| Foundation | Fraunces display + Manrope text through local `next/font`; semantic light/dark/system; reduced motion; media/gallery/crop kit; accessible controls, focus, loading/empty/error/retry | SRC crest supplied by the council and wired into web + mobile brand surfaces; generated scenes and CC0 samples are labelled |
| Shell/search | Five navigation groups, 24 preserved destinations, collapsed desktop rail, four mobile tabs + More; Cmd/Ctrl+K, scoped search, cancellation/partial errors | Typed catalog, loaded-record scopes; client role selection is not authorization |
| Home | Conditional sponsor/video-first placement, Clubs photo hero, six photo shortcuts, official HTTPS LMS/SIP links, Accra class preview, owned tasks/Undo/progress, dated recommendations | Bounded server sources, no API demo fallback; private task service; no official sync or personalization claim |
| Auth/onboarding | Photo forms, Zod/RHF validation, reveal/hide, submitted local identity, safe return, five-step progress/resume/skip/replay, optional visit portrait, logout/cross-tab clearing | Demo does not verify credentials or send reset email; proposed cookie API is unverified |
| Clubs | 16 fictional communities, search/interests/sort/All/My/Saved, six-card pages, rich stories/facts/crew/gallery, request/withdraw/leave/reapply | Canonical saves, source/owner/role guards; preserved executive Approve/Reject and reload persistence; no real enrollment/payment |
| Events | 16 fictional plans, composed filters/pages/details/agenda/gallery, RSVP/cancel/save/status/countdown, actual timed/all-day ICS | Demo QR explicitly invalid for entry; API QR only from validated publisher payload; no ticket authority/payment |
| Discover | Eight categories, balanced 24-record edit, all **96** current loaded demo records, six-card pages, URL search/filter/sort/history, Saved, partial/retry/load-more | Eight bounded sources; canonical cross-feature saves; search/Saved cover loaded records only |
| Accommodation | 12 listings/details, GH₵/amenities/location/gallery, saves, contacts/enquiry/concern drafts and map search | Category illustrations are not property photographs; no actual enquiry transmission or verified availability |
| Marketplace | 12 listings/details, filters/saves/contact/concern; private required-photo create/crop/reload/edit/close/delete | Private owned records, not public sales, checkout, moderation or real upload |
| Opportunities | 12 listings/details, deadlines/types/eligibility/gallery, saves, application preparation/concern | No submitted application, hiring or official partner claim |
| Lost & Found | 12 report sheets, status/type/search/Saved/pages, private required-photo create/crop/reload/edit/resolve/delete | Board routes preserved; no invented individual URL, official report delivery or identity verification |
| Academics | 12 resource details/filter/save/gallery; real labelled demo-note download; weighted semester GPA and note CRUD | Personal estimates/notes, not official grades or fabricated course materials |
| Calendar/timetable | Week/month/agenda, date navigation, source classes/event plans + owned schedules, create/remove/reload and actual ICS | Personal schedule/exports, not institutional registration or live calendar synchronization |
| Profile | Editable name/preferences/programme/level/bio/links, owned photo prep and account-linked summaries | Private preferences preserve account/role; no account-ID/email/role editing, public publication or official profile write |
| Community | 12 public fictional stories plus owned posts/photos, reactions, nested replies and concern drafts, filter/pages/reload | Private workspace additions, not broadcast/moderation/realtime service |
| Messages | Supplied conversation previews, owned threads, history/draft/photo, reload/cross-tab behavior | Private saved messages, not contacted recipients or delivered/read receipts |
| Notifications | Supplied updates, source-qualified unread badge, individual/all read, filters/pages/destinations/reload | Cookie API read-state proposal; no demo unread fallback for guest/API identity |
| Tasks/study | Canonical task CRUD/complete/reopen/filter/stats; structured subject/day/week/time/duration/break/focus controls, saved history and actual plan ICS | Deterministic study drafting, **not AI**; reminders remain manual notes; owner-safe typed writes |
| Announcements | 12 updates, search/category/All/Saved/pages, pinned cards/details, canonical saves | Fictional announcements; unavailable/Saved-failure states are not false empty feeds |
| SRC Office | Supplied representatives/projects and bounded title/category/description request form/status | Demo requests remain local; no claim that an SRC office received or processed them |
| Media | Four records, native deferred CC0 video/audio playback where available, saves, transcript/captions | Two legacy recordings remain honestly unavailable; licensed test footage/sound is not GCTU media |
| Participation | Membership decisions and planned RSVPs | No fabricated attendance, awards or contributions |
| Advertising/Management | Supplied campaign schedule/status and role-relevant existing workspaces | No fake billing/publishing console or client-side authorization |
| Settings | Appearance/system/reduced-motion, privacy boundaries, profile preferences, tour replay, source-aware sign-out | Local clearing is verified; unconfirmed backend/storage clearing is disclosed |

## Verified current gates

- Lint, strict typecheck and production build pass; **221 native tests**, zero failures (14 isolated suites; 210 original frontend + 11 release checks).
- **732 canonical views**, zero AA/visible-overflow/sub-44px flags; 244 mobile AA analyses. **1,439 additional AA/layout workflow captures** pass. All 37 route templates were manually reviewed at 360/1280 in light/dark through 20 overview sheets; tablet and all canonical entity variants have automated coverage.
- **507 application TS/TSX files**: zero `any` type nodes, direct UI fixture imports or literal component palettes; no forbidden environment/build/dependency artifacts versioned.
- Route titles/descriptions/Open Graph and demo `noindex` validate for all 122 routes/detail records. `/design` is production 404; existing URLs and streamed detail not-found behavior remain.
- Production Home Lighthouse: latest default-renderer confirmation **92/92/90 Performance**, **100 Accessibility**, median **92** (preceding isolated set 91/92/91, median 91). This satisfies the requested local lab ≥90/≥95 targets, not a physical-device guarantee.
- Runtime dependency audit: **0**. Current full audit: **5 high development-chain reports** from one unpatched braces advisory (previously 9; four moderate reports removed), disclosed rather than hidden behind a forced downgrade.

## External release gates — not marked complete

A real backend must supply authentication/session/authorization/CSRF, database/durability, verification/MFA/email/reset, upload scanning/quota/storage, realtime/message delivery/moderation, AI, payment/enrollment/entry and authoritative academic/timetable integration. Client guards and fixtures do not prove those systems. Authorized SRC artwork, physical-device/Safari/Firefox/IME and full screen-reader checks remain external. PWA/offline write caching was optional and is not installed; the frontend does not fabricate offline server acceptance.

Repeatable CI, offline toolchain compatibility and the visible bounded advisory policy are documented in [release hardening](RELEASE_HARDENING.md); the earlier final summary remains historical evidence.

# Phase 6L — Tasks and Study Assistant

Verified frontend milestone, 11 October 2026. Routes `/tasks` and `/study-assistant` remain intact. No runtime dependency or new image was added; both use the central generated study-cover illustration and semantic photo-led magazine header.

## Tasks

Private, role/source-qualified task workspace with creation, editing, completion/reopening, deletion, loaded-record title/description/category search, All/Open/Completed/Overdue and six-record pages. Existing `t1` / `t2` and canonical demo task state are retained, so same-profile Home activity observes real local changes. Mutations go through the typed lazy `taskService`, not direct UI store writes. Forms bound title/description and validate real optional dates, priority and category; pending operations are single-flight and keep failed inputs available.

A due date becomes overdue only **after the entire date in Africa/Accra**, not at midnight at its start. Accra has UTC/GMT without seasonal DST. Mobile review caught squeezed task text beside three actions; cards now stack content/actions below 640px. Compact mobile stats and grouped desktop form controls were also corrected.

Demo updates are device-local, with explicit visit-only handling when durable storage cannot be verified. API tasks are publisher-owned and do not write demo task state. Proposed API: `GET /tasks` → validated `TaskItem[]` (max 200, unique IDs); `PUT /tasks/{encodedId}` with the complete typed task and `DELETE /tasks/{encodedId}` → `{ok:true}`. Requests are credentialed/no-store, caller-aware and bounded at ten seconds. Account/source/role/abort checks guard reads and accepted completion; backend identity/ownership/CSRF/idempotence remain mandatory.

## Study planning — honest deterministic engine, not AI

The old fixed text ignored duration/constraints. It is replaced with a typed, validated **deterministic planning service**, explicitly not an AI model, official university timetable or personalized academic adviser. No request or notes go to an AI provider.

Students choose subject, seven-day window, available weekdays, start time, 45/60/90-minute duration, 5/10/15-minute breaks and Revision/Practice/Mixed focus. Output honours all these structured controls, crosses month/year boundaries safely and rejects sessions/breaks extending past midnight. Mixed rotates revision, practice and recall/reflection without fabricating subject expertise.

Free-text constraints/reminders are retained and shown as **manual context, not interpreted scheduling rules**. The UI says to set actual availability with the controls and check conflicts against real commitments. Generated drafts are snapshots; editing form controls requires generating again. Draft schema verifies the recorded sessions match their stated controls.

Drafts persist idempotently in owner-qualified `studyPlans` via the existing lazy workspace boundary (`GET /workspace/studyPlans` returns a validated array; PUT/DELETE `/workspace/studyPlans/{id}` acknowledge `{ok:true}`). Latest six loaded drafts are explicitly disclosed, with deletion. Demo storage is private/device-local; API mode requires a connected service. Existing bounded photo/private workspace limits apply. There is **no deployed model or backend**.

Real downloadable `.ics` exports contain one tentative UTC event per selected day, correct start/end, escaped/folded UTF-8 CRLF, local planning UID and a not-official/live-sync warning. They do not silently modify the official timetable or promise calendar sync. A real AI integration would require separate consent/privacy, model/transport, retention, safety and conflict-validation controls; no fake AI endpoint is implied.

## Executed verification

- Fresh eleven-suite native sweep: **198/198**; independent Study suite: **12/12**. Tests cover controls/date/midnight/schema bounds, deterministic generation/no AI fetch, availability and year transitions, focus/manual context, stored-session consistency, owner persistence, full-day task semantics, canonical task CRUD, denied persistence, actual ICS and native controlled API credentials/no-store/PUT/DELETE/role/abort/DTO rejection.
- Lint, strict typecheck and optimized build passed, including the mobile fixes. React Hook Form availability uses `useWatch` rather than a compiler-incompatible `watch` call; no lint warning is suppressed.
- `node scripts/phase6-study-audit.mjs`: **42 production captures**, clean exit: two screens ×360/768/1280 ×light/dark, plus 360/1280 light/dark validation/CRUD/reload/empty/controlled-plan/ICS/save/delete and guest gates. AA, overflow and 44px checks pass; tracked workflow page exceptions are empty.
- Each screen manually reviewed at mobile/desktop in light/dark. Corrected task-card and generated/saved plan captures were reviewed again. Actual browser download bytes verified three correctly timed events.
- Largest feature module 148 lines; no added runtime package/image.

Ignored evidence: `.cache/phase6/study/{native,native-all,build,browser}.log`, `browser/checks.json`, PNGs and downloaded ICS. Tooling captures now pin sticky shell at scroll-top for honest full-page review; this is not an app behavior change.

External gates remain: deployed backend/auth/authorization/CSRF/durability, real AI/transport, authorized SRC artwork, physical-device/assistive-technology testing and Home standard-renderer/physical-device Performance ≥90. Continue automatically to SRC/announcements/participation/media/management/advertising/settings, polish and final verification.

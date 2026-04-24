# Firestore content model

This project keeps all public marketing copy and ordered lists in **Firestore** so the site updates in real time via `onSnapshot` (no RTDB, no external CMS). Admin UIs under `/admin` write the same collections the homepage reads.

## `siteContent` (collection)

One document per section; document id is the key (`hero`, `navbar`, `knowUs`, `partners`, `whyJoin`, `cellules`, `processSteps`, `footer`). The homepage subscribes once to the whole collection and parses each doc (see `lib/content/site-content-parser.ts`). **Hero** holds eyebrow, location, title lines, accent indices, CTAs, optional video URL, live activity rows, tech stack labels, and growth stats. **Navbar** stores logo text, ordered nav links, and primary CTA. **Know Us** stores the section title (`mainTitle`), optional intro line (`emailHeading`), and ordered `cards` with `body` text. **Partners** is title plus `logos[]` with HTTPS `imageUrl`s. **Why Join** supports both the newer shape (`eyebrow`, `highlights`, `steps` with `order`) and the legacy admin shape (`smallHeading`, `cards` with `description`). **Cellules** accepts `intro` or legacy `subtitle`, and `items` or legacy `cards`. **Process steps** accepts schema fields or the admin shape (`titleLine` / `titleAccent`, steps with `badge` and `description`). **Footer** holds tagline, contact strings, `columns[]` with link groups, and `socials[]` with platform + URL.

## `events` (collection)

Each event is a document with `title`, `slug`, `date`, `dateTba`, venue and maps URLs, media URLs, rich text fields, `order`, `isActive`, `featured`, and optional website button flags. The public homepage queries **only** documents where `isActive == true`, ordered by `order`, so drafts stay admin-only.

## `teamMembers` (collection)

Member profiles include name, slug, year, status, roles, cells, bios, contacts, photo URL, visibility flags, and **`isActive`** / **`isVisible`** (both must be explicit booleans for public queries). The public directory and homepage use queries that include **`where("isActive", "==", true)`** and **`where("isVisible", "==", true)`** so the query shape matches what security rules can authorize for unauthenticated clients. Admin list pages run as **signed-in admin** and may use broader listeners. After tightening rules, run **`npm run backfill:visibility`** once (Admin SDK) to set **`isVisible: true`** on legacy documents where the field was missing.

## Security rules ↔ client queries (do not skip)

Firestore validates **collection queries** against rules: the `where` / `orderBy` clauses must prove every matching document could satisfy the `allow read` predicate. A rule like `allow read: if resource.data.isActive == true` is **not** satisfied by an unfiltered `collection("events")` listener—even if every row happens to be active—because the query does not constrain `isActive`. Always mirror rule predicates with equality filters on the client for anonymous reads.

**Known failures fixed in this repo (for PR / changelog notes):**

- `teamMembers` — unfiltered `onSnapshot(collection("teamMembers"))` (team page “debug gate”, dev raw listener) → **permission-denied** under per-document rules. **Fix:** remove the gate; use only constrained queries; dev debug uses `isActive` + `isVisible` + `limit`.
- `teamMembers` — `subscribeToTeamByYear` / homepage team without **`where("isVisible", "==", true)`** → denied once rules required both flags. **Fix:** add the filter; add composite index; **`mapTeamDoc`** treats only **`isVisible === true`** as public.
- `faq/config/questions` — `orderBy("order")` without **`where("isVisible", "==", true)`** → denied. **Fix:** public query adds the filter; rules require **`isVisible == true`**; FAQ writes already set the field in admin + seed.
- `events` — homepage already used **`where("isActive", "==", true)`**; no change required.

Deploy **`firestore.rules`** and **`firestore.indexes.json`** together (`firebase deploy --only firestore:rules,firestore:indexes` from `web/`) after changing queries. Use the **Rules Playground** with **Authentication: off** and the same collection path + `where` clauses to confirm each public listener.

## `pageSections` (collection)

Drives section titles and ordering for parts of the homepage (e.g. Events, Team, FAQ headings). Public read; admin write.

## `faq` (document + subcollection)

Document **`faq/config`** stores the section eyebrow, headline (`title` + `accent` gradient word), subtitle, category tabs, and CTA copy. Subcollection **`faq/config/questions`** holds one document per FAQ row with `categoryId`, `question`, `answer`, `accentColor`, `icon`, `order`, and `isVisible`. Hidden questions are omitted from the public listener and blocked for anonymous reads by rules.

## `apply` (collection)

Split across documents **`hero`**, **`leftPanel`**, **`contactRows`** (field `rows` with typed rows), **`socialLinks`** (platform keys to URLs), **`form`** (titles, field labels, placeholders, `yearOptions`, `departmentOptions`), and **`submitBlock`** (charter copy/URL, submit label, success state). The client merges these into a single `ApplySectionConfig` for the Apply section component.

## `eventsConfig` (collection)

Document **`public`** carries **`emptyTitle`** and **`emptyMessage`** for the events carousel when there are no active events, so the empty state copy is editable without code changes.

## `siteConfig` (collection — layout and navbar)

Document **`siteConfig/sections`** controls homepage section order and visibility. Fields: **`order`** (string array of section IDs) and **`visibility`** (map of sectionId → boolean). Known IDs: `hero, events, knowUs, whyJoin, cellules, processSteps, faq, apply, footer`. Hero and footer are rendered outside the dynamic section loop (in `app/page.tsx`) — their IDs are recognized by the admin layout editor for future use. Unknown IDs are silently ignored on render (forward-compatible). The admin layout page at `/admin/layout` writes this document.

The `siteContent/hero` document is extended with **`backgroundMedia`** (type, videoUrl, videoPosterUrl, imageUrl, loop, muted, autoplay), **`mask`** (enabled, opacity 0–1, color hex, gradient), and **`datashow`** (enabled, imageUrl, caption, position). When `backgroundMedia.type == "none"` (the default), the hero falls back to the legacy `videoUrl` field and hardcoded overlay, preserving backward compatibility.

Hero now also stores:
- `stats.tiles[]`: ordered tile objects. Each tile:
  - `id: string`, `label: string`, `labelSingular: string | null` (used when count === 1)
  - `source`: `"manual" | "members-live" | "cellules-live" | "events-live" | "events-upcoming" | "events-past" | "partners-live" | "faq-live" | "team-alumni" | "years-active" | "projects" | "awards"`
  - `manualValue: string` — free text for manual sources or fallback while derived data loads
  - `prefix: string`, `suffix: string` — rendered adjacent to the number, no spaces
  - `color: "violet" | "cyan" | "emerald" | "fuchsia" | "amber" | "white"` — restricted palette
  - `size: "sm" | "md" | "lg"`, `emphasis: "number" | "label" | "balanced"`
  - `format: "plain" | "compact" | "padded"` — compact formats large numbers as K/M/B; padded zero-pads to 3 digits
  - `animate: "none" | "count-up" | "pulse"` — count-up runs once via IntersectionObserver; respects `prefers-reduced-motion`
  - `href: string | null` — if non-empty, wraps the tile in a link
  - `order: number`, `isVisible: boolean`
- `stats.roundDerivedTo: number` — round derived counts down to nearest 1/5/10/25/50/100.
- `statsStrip`: strip-wide controls.
  - `isVisible: boolean` — master switch for the whole strip.
  - `layout: "row" | "grid-2" | "grid-4"` — row wraps on mobile; grid-4 scrolls horizontally on narrow screens.
  - `separator: "line" | "dot" | "none"` — only visually effective in row layout (grids rely on gap).
  - `alignment: "left" | "center" | "right"`
  - `background: "transparent" | "panel" | "glow"`
  - `animateOnScroll: boolean` — master switch for count-up animations across the strip. Ignored when `prefers-reduced-motion` is set.
- `foundedYear: number | null` — club founded year, used by the `years-active` source. Colocated on `siteContent/hero` so it reuses the existing hero listener (no new `onSnapshot`).
- Source aliases: legacy values `members`, `cellules`, `events`, `events-all`, `partners`, `faq-questions` are read-migrated to the new `-live` names by the parser; saves always write the new names.
- `techStack.items`: ordered pill objects `{ id, label, accent, order, isVisible }`.
- `growth`: `{ title, metric, months }` (`metric` currently supports `newMembers`).

The `team-alumni` source requires team members with `status=="alumni"`. Today's `teamMembers` listener on the homepage filters `isActive==true AND isVisible==true` (to satisfy the current security rule), so alumni (typically `isActive==false`) are not loaded. Tiles bound to `team-alumni` fall back to `manualValue` until either the rule is relaxed or a dedicated alumni listener is added.

## `activity` collection

- Path: `activity/{autoId}`
- Fields:
  - `title: string`
  - `createdAt: Timestamp`
  - `isVisible: boolean`
  - `order?: number` (reserved; current public query uses `createdAt desc`)
- Public read query must include `where("isVisible","==",true)`.
- Writes are admin-only.

## `submissions` (collection)

One document per public form submission (auto-ID). Fields: `formId`, `fields` (map of label→value), `submittedAt` (serverTimestamp), `userAgent` (UA+IP hash), `status` ("new"|"read"|"archived"), `readAt`, `notes`, `notificationSent`, `notificationError`. Created via **POST `/api/submissions`** (client-side Firebase SDK, no Admin SDK needed). Rules: anonymous create allowed if status=="new", fields non-empty (<50 keys), and no extra fields (hasOnly). Read/update/delete: admins only.

Email notification is sent via Resend on each new submission. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, and `NEXT_PUBLIC_SITE_URL` in your environment (see `.env.example`). If `RESEND_API_KEY` is absent, submissions still save and a warning is logged.

## `siteConfig` / `teamConfig` (legacy)

Older configuration may still exist for backward compatibility; new work should use **`siteContent`** and the paths above. Security rules still allow read on `siteConfig` for migration periods.

## `siteConfig/navbar` (document)

Navbar rendering is fully Firestore-driven. Fields: `logoUrl`, `logoText`, `links[]` (`id`, `label`, `href`, `isExternal`, `order`, `isVisible`), `ctaButton` (`label`, `href`, `isVisible`), and `showThemeToggle`. Public navbar reads this via `useFirestoreDoc("siteConfig/navbar")`; `/admin/navbar` edits it.

## `siteConfig/sections` (document)

Homepage ordering/visibility control. Fields: `order` (array of section IDs) and `visibility` (sectionId -> boolean). Known IDs: `hero`, `events`, `knowUs`, `whyJoin`, `cellules`, `processSteps`, `faq`, `apply`, `footer`. Unknown IDs are ignored so future sections can be added without runtime crashes.

## `siteConfig/adminShell` (document)

Controls the admin sidebar — which links appear, in what order, and whether the footer "View site" link and light/dark theme toggle are shown. Admin-only surface; still stored under `siteConfig` (publicly readable) since it contains no sensitive data.

Fields:
- `order`: string array of admin hrefs in display order (e.g. `"/admin/events"`). Unknown hrefs are ignored; missing known hrefs are appended in their default position (forward-compatible).
- `visibility`: map of href -> boolean. `false` hides the entry in the sidebar.
- `showViewSite`: boolean. Hides the "View site" link in the sidebar footer when `false`.
- `showThemeToggle`: boolean. Hides the light/dark theme toggle button when `false`.

**Locked items** (never hidden, regardless of config): `/admin/dashboard` and `/admin/layout`. This prevents admins from locking themselves out of the settings surface. Locked items can still be reordered.

Edited from the "Admin sidebar" block on `/admin/layout`. Applied in real time via a single `onSnapshot` listener on `siteConfig/adminShell` inside `AdminShell`.

## Rule–query coupling

**Every public collection query must include a `where()` clause that mirrors the rule's predicate**, otherwise Firestore rejects the whole query even if every matching document satisfies the predicate individually.

| Collection | Rule predicate | Required query filter |
|---|---|---|
| `events` | `resource.data.isActive == true` | `where("isActive", "==", true)` |
| `teamMembers` | `isActive == true && isVisible == true` | `where("isActive", "==", true)` + `where("isVisible", "==", true)` |
| `faq/config/questions` | `resource.data.isVisible == true` | `where("isVisible", "==", true)` |
| `siteContent` | `if true` | no filter needed |
| `siteConfig` | `if true` | no filter needed |
| `submissions` create | status=="new", fields non-empty, hasOnly(...) | enforced by route handler, not a public query |

If you add a new guarded collection, always add the matching `where()` in client-side queries and verify in the Firebase Firestore **Rules Playground** with auth=off before merging.

## Seeding

Run from `web/`: `npm run seed:firestore`. Uses Firebase Admin; skips documents that already exist unless you pass **`--force`**. Set **`FIREBASE_SERVICE_ACCOUNT_JSON`** (recommended) or use ADC with **`FIREBASE_PROJECT_ID`** / **`NEXT_PUBLIC_FIREBASE_PROJECT_ID`**.

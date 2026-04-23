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

## `siteConfig` / `teamConfig` (legacy)

Older configuration may still exist for backward compatibility; new work should use **`siteContent`** and the paths above. Security rules still allow read on `siteConfig` for migration periods.

## Seeding

Run from `web/`: `npm run seed:firestore`. Uses Firebase Admin; skips documents that already exist unless you pass **`--force`**. Set **`FIREBASE_SERVICE_ACCOUNT_JSON`** (recommended) or use ADC with **`FIREBASE_PROJECT_ID`** / **`NEXT_PUBLIC_FIREBASE_PROJECT_ID`**.

# Club Web — a documentary

A Next.js 16 / React 19 marketing site for the Robotics & AI Club, backed entirely by Firestore, with every string, list, and image editable from the `/admin` panel and reflected on the public site within about one second via `onSnapshot`. No CMS, no backend service — **the rules file is the API contract**.

---

## Scorecard

| | |
|---|---|
| **Source files (ts/tsx/css)** | 127 |
| **Application code** | ~895 KB |
| **Firestore collections** | 13 |
| **Admin pages (sidebar nav)** | 12 |
| **Framework** | Next.js 16.2.4, App Router, React 19.2.4 |
| **Theme** | Dark-only on the public site (light mode removed); admin has its own independent toggle |
| **Runtime Firebase client** | Web SDK v11 (Firestore-only) |
| **Firebase Admin SDK** | `scripts/` only — never in runtime app code |

---

## What this project actually is

A single Next.js app living in `web/`. The public site at `/` composes a hero, events, a "know us" block, "why join", cellules, process steps, FAQ, apply form, and footer — with layout order and per-section visibility driven by `siteConfig/sections`.

The `/admin` surface is a protected twin with 12 editors that write to the same Firestore documents the public site reads, so saving an edit visibly mutates the site live — you never restart anything.

Form submissions go through `POST /api/submissions`, get a per-UA/IP rate limit, land in the `submissions` collection, and fan out a Resend email to the admin inbox.

> **One principle, everything else falls out.** Every public query on the homepage must be shape-compatible with the security rule on that collection. Firestore validates the _query_ against the rule — not the documents it returns — so `where("isVisible", "==", true)` ends up everywhere as a deliberate architectural decision.

---

## Architecture at a glance

### Public site · `app/`
- `app/page.tsx` renders `HomePageShell`, which subscribes to `siteConfig/sections` and orders child components via CSS `order`.
- Child sections each own their own `onSnapshot` via `useFirestoreDoc` / `useFirestoreCollection`.
- Three.js / Fiber powers the hero particles; Framer Motion drives reveal animations; every non-hero sub-surface degrades to a static fallback under `prefers-reduced-motion`.

### Admin panel · `app/admin/(panel)`
- Route group with its own layout rendering `AdminShell` — sidebar (ordered, hideable, locked items can't disappear), mobile drawer, and an independent admin-only dark/light toggle.
- Sidebar config lives at `siteConfig/adminShell`, edited from `/admin/layout`.
- Gate: `components/admin/require-admin.tsx` redirects anyone not in the email allowlist to `/admin/login`.

### Data layer · `lib/firebase`
- `firebase.ts` — lazy, validated, singleton `db()` / `auth()` / `storage()`, with `experimentalForceLongPolling: true` to dodge flaky streams in dev.
- `realtime.ts` — one `subscribeTo*` per public entity; all of them include the _exact_ `where()` filters the rules demand (dev-only logging on denial).
- `types.ts` — the central typed Firestore vocabulary (everything else imports from here).

---

## Firestore content model

Public reads are anonymous and rule-guarded; admin writes require a signed-in admin email. No document is admin-write-protected by _fields_ — only by role — so the admin UI and rules stay compatible.

| Collection / doc | Role | Public read rule | Required client filter |
|---|---|---|---|
| `teamMembers` | Member directory + homepage team | `isActive == true && isVisible == true` | `where isActive, isVisible` |
| `events` | Events carousel + `/events/[slug]` | `isActive == true` | `where isActive` |
| `activity` | "Live activity" hero card | `isVisible == true` | `where isVisible` |
| `faq/config/questions` | FAQ section | `isVisible == true` | `where isVisible` |
| `siteContent/*` | hero, navbar, knowUs, partners, whyJoin, cellules, processSteps, footer | public read | no filter needed |
| `siteConfig/*` | sections, adminShell, navbar, apply, etc. | public read | no filter needed |
| `apply/*` | hero, leftPanel, contactRows, form, submitBlock, community | public read | merged on client |
| `submissions` | Public form submissions | admin only | create-only from API route w/ payload allowlist |
| `rsvps` | Event RSVPs | admin only | create-only anonymous |

### Rule ↔ query coupling

Firestore validates the _shape_ of a query, not the documents it happens to return. A collection listener without the matching `where` clauses gets rejected even when every row satisfies the rule — hence the rigid pattern of mirroring every predicate on the client. Known denials previously caught and fixed are documented in `docs/content-model.md` (team page debug gate, unfiltered FAQ listener, etc.).

### Admin boundary

- `isAdmin()` resolves against a hardcoded email allowlist in `firestore.rules`.
- The Firebase **Admin** SDK appears only in `scripts/` (seed, backfill). The app itself — API routes included — uses the **Web** SDK so rules remain the single source of security truth.
- Form submissions use `hasOnly()` + size limits + status pinning at the rule level to stop payload bombs and field smuggling.

---

## The homepage, section by section

Rendered inside `HomePageShell`; order and visibility come from `siteConfig/sections`. Every section degrades to a minimal static fallback if its Firestore document is missing or malformed.

| Section | Backing doc | What it does |
|---|---|---|
| **Hero** | `siteContent/hero` | Eyebrow, two-line title with accent words, CTAs, background media (video / image / none), overlay mask, datashow badge, stats strip (live / manual / formatted counts), three floating cards (Live Activity, Tech Stack, Growth chart), plus the Three.js particle scene. Edited from `/admin/hero` and `/admin/activity`. |
| **Events** | `events` (collection) | Carousel of active events ordered by `order`; featured events pinned first. Each card links to `/events/[slug]` which can render either a live doc or a one-shot server fetch. Empty state copy from `eventsConfig/public`. |
| **Know us** | `siteContent/knowUs` | Intro line + up to six cards of body copy. Pure copy block on purpose — no images. |
| **Why join** | `siteContent/whyJoin` | Small heading + title + description + up to 12 benefit cards. Supports both the modern `highlights/steps` shape and the legacy `cards` shape, so the admin UI can migrate gradually. |
| **Cellules** | `siteContent/cellules` | Eyebrow, title, subtitle, then up to 12 cells with a lucide icon key OR a custom `iconImageUrl`. Icon keys are whitelisted in the parser to avoid bogus names crashing the render. |
| **Process steps** | `siteContent/processSteps` | How-it-works section. Ordered steps with badge/title/description/iconKey. Icon set is a categorised whitelist of ~50 lucide icons (People / Progress / Tech / Creativity / Admin / Science). |
| **FAQ** | `faq/config` + `.questions` | Doc has eyebrow, title, subtitle, category tabs, CTA. Sub-collection holds per-question categoryId/question/answer/color/iconKey/order/isVisible. Both the question listener _and_ the rules require `isVisible == true`; hidden questions never leave Firestore. |
| **Apply** | `apply/*` (multi-doc) | Merged in `apply-docs-merge.ts`: hero, leftPanel, contactRows, form (labels + year/dept options), submitBlock, community. The "Community" card drives the social-media strip with brand-accurate top icons plus per-action color presets or custom HEX for buttons. |
| **Footer** | `siteContent/footer` / `siteConfig/footer` | Tagline, contact line + email, nav columns, social links (validated against a platform allowlist). |

---

## Admin panel

Route group `app/admin/(panel)`; sidebar rendered by `AdminShell`. `/admin/dashboard` and `/admin/layout` are locked — they can be reordered but not hidden, so an admin can never accidentally lock themselves out.

| Route | What it edits | Backing document(s) |
|---|---|---|
| `/admin/dashboard` | Landing / overview | — (read-only tiles) |
| `/admin/hero` | Hero + stats strip + tile editor | `siteContent/hero` |
| `/admin/activity` | Hero cards (Activity, Tech Stack, Growth) | `activity`, `siteContent/hero.techStack`, `hero.heroCards`, `hero.growth` |
| `/admin/team` | Team member CRUD | `teamMembers` |
| `/admin/team/taxonomy` | Roles & cells catalog | `teamConfig` |
| `/admin/events` | Events CRUD + media + CTA colors | `events` + `eventsConfig/public` |
| `/admin/basic` | Know us, Why join, Cellules, Process steps | `siteContent/*` |
| `/admin/navbar` | Navbar logo, links, CTA | `siteConfig/navbar` |
| `/admin/faq` | FAQ config + questions | `faq/config` + `faq/config/questions` |
| `/admin/apply` | Apply section incl. Community card | `apply/*` |
| `/admin/submissions` | Form submissions (view / archive) | `submissions` |
| `/admin/layout` | Section order, admin sidebar config | `siteConfig/sections` + `siteConfig/adminShell` |

---

## Tech stack

**Framework**
Next.js 16.2.4 · React 19.2.4 · App Router · TypeScript 5 · Tailwind v4

**Data & email**
Firebase Web SDK 11 · Firestore (only) · Firebase Admin SDK (scripts only) · Zod · Resend · Zustand

**UI, motion, 3D**
lucide-react · framer-motion · motion · gsap · three.js · @react-three/fiber · react-day-picker

---

## Two key request flows

### Public page load → live update
1. Browser requests `/`.
2. React Server streams `HomePageShell`; client hydrates.
3. `useEffect` opens a single `onSnapshot` on `siteConfig/sections` for layout order.
4. Each section mounts its own `onSnapshot` (hero, events, team, faq, etc.) — queries shape-match the rules.
5. Admin saves in `/admin/*` → Firestore change → every open `onSnapshot` emits → React re-renders. No page reload, no stale cache.

### Form submission (apply, contact, RSVP)
1. Client `POST /api/submissions` with `{ formId, fields, website }`.
2. Route validates with Zod, honeypot-skips if `website` is filled.
3. Best-effort rate-limit read keyed on `UA + sha256(ip).slice(0,16)`; caps at 5 per hour per key. If the read is blocked by rules, the create path still runs (documented behaviour, stronger rate limiting is a future Redis concern).
4. `addDoc` to `submissions` — rule `hasOnly()` enforces the field allowlist.
5. Fire-and-forget Resend email to `ADMIN_NOTIFICATION_EMAIL`; success/failure recorded back on the doc.

---

## Engineering constraints — the rules of this repo

- **Admin SDK is for scripts only.** Nothing under `app/`, `components/`, `middleware`, or API routes may import `firebase-admin`. The runtime must be constrained by security rules or the rules stop being the source of truth.
- **Rule → query coupling is mandatory.** Every new public collection query ships with the `where()` clauses that mirror the rule predicate, plus a matching composite index in `firestore.indexes.json`. Both deploy together: `firebase deploy --only firestore:rules,firestore:indexes`.
- **Restricted palettes over free inputs.** The stats-tile editor picks from six brand colors; the community-card admin has preset color swatches plus a single custom HEX escape hatch. No free font, gradient, or CSS inputs — the constraints are what keep the site on-brand.
- **Listener budget on the homepage.** New data sources reuse existing `useHomeContentStore` subscriptions. If a new `onSnapshot` is genuinely required, it has to be flagged in the PR description.
- **Dark theme only.** `lib/theme/site-theme.ts`, the light-mode CSS, and the navbar toggle were removed; the admin panel keeps its own independent theme switcher for operator comfort.
- **Accessibility + motion.** Every count-up / pulse animation respects `prefers-reduced-motion`. Count-up runs once via `IntersectionObserver` to avoid retriggering on re-render. All animated states have static fallbacks.

---

## Scripts & tooling

| Command | Purpose |
|---|---|
| `npm run dev` | Next dev server on :3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint (Next config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed:firestore` | Admin-SDK one-time seed of defaults (idempotent; `--force` to overwrite) |
| `npm run backfill:faq-visibility` | Set `isVisible=true` on legacy FAQ docs |
| `npm run backfill:visibility` | Set `isVisible=true` on legacy team members |
| `npm run optimize:media` | SVG + image pipeline (sharp, svgo, ffmpeg) |
| `npm run test:e2e` | Playwright end-to-end tests |

---

## Environment variables

Defined in `.env.local` (not committed). `NEXT_PUBLIC_*` variables ship to the browser and are validated by `assertFirebaseConfigForRuntime()` before the Firestore client is instantiated.

| Variable | Required? | Notes |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | yes | Web SDK init |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | yes | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | yes | Must trim non-empty or Firestore paths become `projects//...` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | yes | |
| `NEXT_PUBLIC_FIREBASE_MSG_SENDER_ID` | yes | or `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | yes | |
| `RESEND_API_KEY` | no | If missing: submissions still save, email skipped |
| `RESEND_FROM_EMAIL` | no | Fallback: `onboarding@resend.dev` |
| `ADMIN_NOTIFICATION_EMAIL` | no | Notification inbox |
| `NEXT_PUBLIC_SITE_URL` | no | Used for admin deep-link in emails |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | scripts/ | Admin SDK credentials for seed/backfill only |

---

## Recently shipped

Highlights from the current working branch, newest first.

- **Removed light mode from the public site** — deleted `lib/theme/site-theme.ts`, every `html[data-theme="light"]` block in `globals.css`, the `localStorage` init script, the navbar toggle, and the partners-marquee light branch. The admin panel keeps its own independent theme toggle.
- **`/admin/layout` spacing pass** — nav-item rows in the Admin Sidebar editor now have `px-4 py-3` padding, the card got `p-5 sm:p-6` interior padding, arrow buttons enlarged to `p-1.5 / size-3.5`, and the path preview hides on narrow screens so labels never collide.
- **Community card under `#apply`** — new social-media strip driven by `apply/community`. Top-strip icons always render brand-accurate colors (Discord blurple, WhatsApp green, etc.); admin buttons use either a preset palette or a custom HEX with auto-contrasting text. Mutually exclusive UI for preset vs custom.
- **Process-step icon set expanded to ~50** — categorised Lucide set (People, Progress, Tech, Creativity, Admin, Science). Admin dropdown, parser whitelist, and component icon map stay in sync. Aliased imports work around lucide-react version drift (`CircleCheck → CheckCircle`).
- **Hero stats strip rebuilt** — per-tile prefix/color/size/emphasis/format/animate/href controls; strip-wide layout/separator/alignment/background/animateOnScroll. Live per-tile preview in admin uses the same renderer as the homepage. `useCountUp` hook via `requestAnimationFrame` + `IntersectionObserver`, respects reduced motion.
- **Admin sidebar became Firestore-driven** — `siteConfig/adminShell` now controls which items appear, in what order, and whether the footer "View site" link and theme toggle show. Dashboard + Layout are locked so admins can't lock themselves out.

---

## Source of truth

Everything in this document is derived from:
- `firestore.rules`
- `firestore.indexes.json`
- `docs/content-model.md`
- `lib/firebase/realtime.ts`
- `components/admin/admin-shell.tsx`
- `app/api/submissions/route.ts`
- `package.json`
- The App Router tree under `app/`

Everything else is rendering.

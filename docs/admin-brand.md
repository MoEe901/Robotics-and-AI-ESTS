# Admin UI — brand alignment

Admin uses its own theme via `.admin-root[data-admin-theme="light|dark"]` and **does not** reuse the public site’s `html[data-theme]` toggle. Public tokens (`--background`, `--futurized-violet`, `--futurized-cyan`) still read from `:root` / `html[data-theme]`; admin surfaces use `--admin-*` variables defined in `app/globals.css`.

## Shell

`components/admin/admin-shell.tsx` wraps authenticated admin routes with:

- `futurized-violet-grid`, `futurized-scanlines`, and `futurized-corner-*` (same language as the public homepage).
- Desktop: fixed left sidebar (`lg+`). Mobile: top bar + drawer.
- Login (`/admin/login`) keeps a minimal root (no grid/chrome) so auth stays focused.

## Page pattern

Prefer this structure on new admin pages:

1. **Container:** `className="admin-page"` — max width, horizontal padding.
2. **Optional kicker:** `className="admin-eyebrow"` — monospace `//` label.
3. **Title:** `className="admin-page-title"` — Syne, clamp sizing.
4. **Subtitle:** `className="admin-page-subtitle"` — muted body under the title.
5. **Cards / list rows:** `admin-card` and, if clickable, `admin-card--interactive`.

Form `input`, `textarea`, and `select` inside `.admin-root` pick up glass backgrounds and cyan focus rings from global admin CSS. Primary actions that use Tailwind `bg-blue-600` are remapped to the violet→cyan gradient in CSS (do not change Firestore or auth logic for styling).

## Light mode

`[data-admin-theme="light"]` extends `--admin-surface`, `--admin-border`, and `--admin-accent-grad` for readable glass and softer gradients. Sidebar and mobile header get light-specific backgrounds via the “SIDEBAR & PAGE POLISH” block in `globals.css`.

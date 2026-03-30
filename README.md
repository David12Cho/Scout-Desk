# ScoutDesk

An NHL front-office scouting tool built as a progressive web app. ScoutDesk demonstrates a full internal-tool stack — real-time data from the NHL API, drag-and-drop draft boards, offline-first scouting reports, and a PWA service worker — all wired together with the technologies used in modern hockey operations software.

**Live demo:** https://scout-desk-fntx28rc3-david12cho-4130s-projects.vercel.app

---

## Features

### Skater Stats
Live NHL skater data fetched from the official NHL Stats API. Rendered with TanStack Virtual for smooth scrolling through 500+ rows without pagination. Filterable by position, team, season, game type (regular season / playoffs), and minimum games played. Default sort by points per 60 minutes (calculated client-side from raw TOI). Click any row to expand NHL Edge skating data on demand — max speed, zone time %, shot velocity.

### Draft Rankings
All four prospect categories (NA Skater, International Skater, NA Goalie, International Goalie) fetched in parallel and merged into a single sortable, filterable table. Prospects are identified with initials avatars color-coded by position since pre-draft players have no headshot URL. Sortable by midterm rank, height, weight, and age.

### Draft Tier Board
Drag-and-drop tier board built with dnd-kit. Scouts drag prospects from the left-panel pool into named tier rows on the right. Supports:
- Intra-tier reordering and cross-tier moves
- Per-tier renaming (click to edit inline) and color selection
- 16 scout flags per player (Elite Skater, Injury Risk, Overager, etc.) with a popover flag picker
- Free-text notes per player (280 char max, saves on blur)
- Season selector — 2023 / 2024 / 2025 draft classes, each with an independent board
- Full persistence via localStorage (swappable for Hasura — see Roadmap)

### Scouting Reports (offline-first)
Write player scouting reports during games with no internet connection. Data writes to IndexedDB immediately via the `idb` library. A sync queue flushes pending reports to the server when connectivity is restored via a `window online` event listener.

Each report includes:
- Player search (searches live TanStack Query cache — no extra fetch)
- Game date, opponent, venue
- Six grade sliders (Skating, Compete, Hockey IQ, Hands, Shot, Defense) — 1–9 scale with red / amber / green color coding
- Projection (NHL1 / NHL2 / AHL / ECHL / Pass)
- Scout flags (same 16-flag set as the tier board)
- 500-character summary
- Sync status badge: `pending` · `synced` · `failed`

Reports are viewable in read-only mode and unlockable for editing. The sidebar footer shows a live online / offline indicator.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Styling | TailwindCSS |
| Data fetching | TanStack Query (deduplication, caching, stale-while-revalidate) |
| Large list rendering | TanStack Virtual |
| Drag and drop | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`) |
| Offline storage | IndexedDB via `idb` |
| PWA / service worker | `vite-plugin-pwa` (Workbox, generateSW mode) |
| Routing | React Router v7 |
| GraphQL backend | Hasura Cloud + Neon Postgres _(see Roadmap)_ |
| Auth | AWS Cognito _(see Roadmap)_ |

---

## Architecture notes

### Data layer abstraction
The tier board and scouting reports both use thin store modules (`src/lib/tierBoard.store.ts`, `src/lib/reports.store.ts`) that expose a consistent CRUD interface. The tier board store currently writes to `localStorage`; the reports store writes to IndexedDB. Both are designed to swap their persistence layer for Hasura GraphQL mutations without touching any UI code.

### CORS proxy
`api.nhle.com/stats/rest` returns no `Access-Control-Allow-Origin` header. In dev, Vite proxies `/api/nhle-stats` → `https://api.nhle.com/stats/rest` and `/api/nhle-web` → `https://api-web.nhle.com`. In production the same paths need to be handled by a reverse proxy or edge function (Vercel rewrites are trivial to add).

### Prospect identity
Draft prospects have no numeric ID in the NHL rankings API — they haven't been drafted yet. ScoutDesk generates a stable synthetic ID: `categoryId × 10000 + midtermRank`. This is unique per prospect per draft class and reversible, so tier board entries can always be joined back to the prospect record.

### Offline sync queue
`reportsStore.save()` always writes to IndexedDB first, then calls `flushPending()` immediately if `navigator.onLine`. `flushPending()` currently stubs to `console.log` and marks reports as `synced` — this is the Hasura mutation insertion point (see Roadmap).

---

## Running locally

```bash
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173`. The NHL API proxy is configured automatically in `vite.config.ts` — no environment variables required for local development.

```bash
npm run build   # production build + PWA precache manifest
npm run preview # serve the dist/ folder locally
```

---

## Roadmap

### Hasura + Neon Postgres
The Postgres schema is already designed:

```sql
users         -- mirrors Cognito sub, created on first login
tier_boards   -- one per scout per draft year
tiers         -- named rows within a board (name, color, order_index)
tier_entries  -- player_id (NHL API ID), flags text[], notes, updated_at
scouting_reports -- client-generated UUID for offline upsert support
```

Row-level security will scope every table to `X-Hasura-User-Id` so scouts only see their own boards and reports. The swap from localStorage → Hasura requires updating `tierBoard.store.ts` to call GraphQL mutations and replacing the `flushPending` stub in `reports.store.ts` with a real upsert mutation.

### AWS Cognito
Add a hosted-UI login flow, store the JWT in memory (not localStorage), and pass it as `Authorization: Bearer <token>` to Hasura. The `userId` string hardcoded as `"local"` throughout the app is a direct swap for the Cognito `sub` claim.

### Production CORS proxy
Replace the Vite dev proxy with Vercel rewrites in `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/api/nhle-stats/:path*", "destination": "https://api.nhle.com/stats/rest/:path*" },
    { "source": "/api/nhle-web/:path*",   "destination": "https://api-web.nhle.com/:path*" }
  ]
}
```

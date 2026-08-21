# Tech stack & how it works

*Reference doc — what's under the hood and why, for anyone picking this project up.*

## Stack at a glance

| Layer | Tech | Why |
|---|---|---|
| Frontend | React 19 + TypeScript, built with Vite | Fast dev server, standard React patterns, no framework beyond what a 3-screen app needs |
| QR generation | `qrcode` | Turns a unit's code into a scannable image, client-side, no server round trip |
| QR scanning | `html5-qrcode` | Reads the camera feed in-browser; handles iOS quirks better than lighter alternatives |
| Unique IDs | `nanoid` (custom alphabet) | Short, human-typeable codes that exclude visually ambiguous characters (`0`/`O`, `1`/`I`/`L`) |
| Staff-device storage | Browser `localStorage` | Instant, works offline, no backend needed for the New Unit / Scan Out / Stock List screens |
| Shared storage | Redis (via a Vercel-connected integration), accessed with the `redis` (node-redis) client | The one thing that *has* to be shared across devices — see "Why two stores" below |
| API | A single Vercel serverless function (Node.js runtime): `api/units/[id].ts` | Minimal surface: look up a unit, or upsert one |
| Hosting & deploys | Vercel, connected to GitHub | Push to `main` → auto-deploy, no manual steps |

## Why two data stores, not one

This is the one architectural decision worth understanding before touching the code.

**Local storage (per device)** is the fast path for the staff screens — New Unit, Scan Out, Stock List. It's instant, needs no network, and matches how the app was scoped: one device doing the day-to-day logging and selling.

**The shared Redis store** exists for one reason: the **buyer-facing page** (`/u/:id`). A buyer scans a tag with *their own* phone, which can never share local storage with whatever device logged that cube. There's no way around a shared backend for that specific screen — so rather than rebuild everything around it, only what needs to be shared is shared:

- Every `createUnit` and `sellUnit` call writes to local storage first (instant, source of truth for the staff UI), then fires a best-effort write to the shared store in the background (`syncUnitToServer` in [`src/lib/api.ts`](../src/lib/api.ts)). If that background write fails, the local operation still succeeds — the buyer page just won't reflect that unit until the next successful sync.
- The buyer page reads **only** from the shared store, with a per-unit `localStorage` cache so a repeat visitor sees "confirmed as of [time]" instead of nothing if the server's briefly unreachable.
- `sellUnit` checks local storage first, and only if the unit isn't found there does it fall back to a shared-store lookup — this is what makes Scan Out work correctly even when a cube was logged on a different device than the one selling it.

## Request flow

**Logging a cube (New Unit):**
```
staff device → generate ID + QR (client-side)
            → save to localStorage (instant)
            → best-effort PUT /api/units/:id (background, don't block on it)
```

**Selling a cube (Scan Out):**
```
staff device → scan/type code
            → check localStorage
                found?  → flip status, save locally, sync to server
                not found? → GET /api/units/:id (maybe it's from another device)
                    found remotely?  → adopt it locally, then flip + sync
                    not found anywhere? → "Unrecognized code"
```

**A buyer scanning a tag:**
```
buyer's phone → opens /u/:id (any browser, no app, no login)
             → GET /api/units/:id
                 success → show it, cache a copy locally
                 fails   → show the last cached copy with "confirmed as of [time]", if one exists
                 nothing cached → "Unavailable"
```

## The API

One file, `api/units/[id].ts`, handling two methods:

- **`GET /api/units/:id`** — look up a unit. Returns the record or a 404.
- **`PUT /api/units/:id`** — upsert a unit (used by the client's background sync on every create/sell).

It runs on Vercel's **Node.js runtime** (not Edge) specifically because the connected Redis integration provisions a plain TCP connection string (`KV_REDIS_URL`), and only the Node.js runtime can open raw TCP sockets — Edge Functions are HTTP/fetch-only.

## File map

```
src/
  lib/
    units.ts     — the data model + local storage read/write + the two-store sync logic
    api.ts       — client-side fetch calls to the shared API
    id.ts        — unique code generation
    config.ts    — builds each QR's URL from wherever the app is actually deployed
    csv.ts       — CSV export for the Stock List's accounting handoff
  components/
    NewUnitScreen.tsx    — log a cube, generate + print its tag
    ScanOutScreen.tsx    — camera or manual-entry sale flow
    StockListScreen.tsx  — running totals, filters, CSV export
    BuyerViewScreen.tsx  — the public /u/:id page
    Scanner.tsx          — the html5-qrcode camera wrapper
    PrintableLabel.tsx   — the physical label layout (print-only CSS)
  App.tsx        — routes /u/:id to the buyer view; everything else gets the staff tab UI

api/
  units/[id].ts  — the one serverless function, GET + PUT

vercel.json      — SPA rewrite so /u/:id serves the app instead of a 404
```

## Deployment

GitHub repo → Vercel project, connected for auto-deploy. Every push to `main` triggers a new build and deploy automatically — no manual redeploy step, except the one time after first connecting a new environment variable (Vercel doesn't retroactively apply env vars to an already-live deployment).

## What this doesn't handle yet

This stack was deliberately kept to the minimum that makes the buyer page work — it is **not** a general-purpose multi-device sync system. See [requirements-checklist.md](./requirements-checklist.md) for what's explicitly still open, in particular: staff devices only pull from the shared store on a cache-miss (Scan Out), not proactively — there's no live "device B sees device A's changes instantly" behavior, and no offline queueing/retry if a sync write fails while offline. Both are known, deferred trade-offs, not oversights.

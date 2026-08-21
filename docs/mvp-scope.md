# Cube Tracker: MVP build scope

*15 Aug 2026 — scrap metal processing, per-unit output*

One QR per metal cube. No quantities, no restocking — just a status per physical unit and a build order that proves the core loop before anything else.

## The core model

Because every cube gets its own QR the moment it's produced, the whole system reduces to tracking one thing per unit: is it still on the floor, or has it been sold. No inventory math, no counters to keep in sync — just a state flip.

```
IN_STOCK  --(scan at sale)-->  SOLD
```

Scanning an `IN_STOCK` unit flips it to `SOLD` and stamps the time. Scanning a unit that's already `SOLD` doesn't touch the record — it just shows when it was sold, which is what stops accidental double-counting outright.

## Data model

One primary table carries almost the entire system. Everything else is a thin log around it.

| Field | Type | Set when | Notes |
|---|---|---|---|
| `unit_id` | short code | Cube produced | Encoded in the QR; also printed in human-readable form as a fallback |
| `status` | enum | Always | `IN_STOCK` / `SOLD` |
| `weight_kg` | decimal | Cube produced | Every cube is a different weight — captured manually per unit, no shortcut |
| `metal_type` | text | Cube produced | Optional if this business only processes one grade for now |
| `produced_at` | timestamp | Cube produced | Doubles as the "find it by date" fallback lookup key |
| `sold_at` | timestamp, nullable | Sold | Null until scanned out |
| `actor` | device id | Both events | One device per staff member — attribution by device, no login required |

Alongside it, a simple `event_log` table (`unit_id`, `action`, `timestamp`, `actor`, `note`) — every create, sell, and manual revert gets a row. This is what makes the year-end accounting export trustworthy, and what lets you answer "why does this number look wrong" months from now.

**Revenue/price field:** intentionally left out of the MVP. It's a nullable addition later — one column, no migration of existing records, no rework of the state machine. Owner confirmed this is "extra" and can be added once the MVP proves itself.

## Screens

| Screen | Used by | Does |
|---|---|---|
| **New unit** ✅ *(built)* | Floor staff | Log a cube as it's produced — weight, optional metal type — generates the unique QR and a print-ready label |
| **Scan out** | Floor staff | Camera scan a QR at sale, confirm, flips status to SOLD. If already sold, shows the prior sale instead |
| **Find / correct** | Staff or owner | Look up a unit by code, or by date + weight range if the label is damaged; revert a wrong scan with a required reason |
| **Buyer view** | Public, no login | Scanning the same QR with any phone opens a plain page: what it is, weight, in-stock or sold, "confirmed as of [time]" if offline |
| **Stock list** | Owner | Filterable table of every unit — status, date range, weight — with running totals |
| **Export** | Owner / accountant | CSV of units sold in a date range, ready to hand off at year end |

## Build order

Ordered so the core value loop — tag a cube, sell a cube, see the count — is provable before any of the harder or lower-payoff engineering gets touched.

1. **Data model + unit creation** — *(done)* the units table, the state machine, and the New Unit screen with QR generation and a printable label.
2. **Scan-to-sell loop** — *(done)* camera-based scan (with a manual code-entry fallback), status flip, the already-sold guard.
3. **Stock list + CSV export** — *(done)* running totals, status filter, and a date-range CSV export of sold units.
4. **Buyer-facing public view** — *(done)* same QR, read-only page, no login. See the architecture note below — this one needed a shared backend sooner than planned.
5. **Find / correct / reissue tag** — the safety net for wrong scans and damaged labels. Hold off until phases 1–2 are validated on real cubes.
6. **Offline queue + sync** — the trickiest engineering piece. Defer until the happy path is proven.
7. **Staff attribution** — *(simplified)* one device per staff confirmed, so this is just a one-time device-to-staff mapping, not a login system. Minimal build effort, can bolt on any time.

## Decisions made since this was first scoped

- ✅ **One QR per physical unit**, not per SKU — each cube is unique.
- ✅ **No restocking** — "stock in" happens at production (a cube comes out of processing), not a supplier delivery.
- ✅ **Unique-per-unit QR solves double-scan counting** — status-based, not counter-based, so re-scanning a sold unit can't double-deduct.
- ✅ **Weight capture is manual entry**, not a hard problem — every cube is genuinely a different weight, so there's no "duplicate last entry" shortcut; the New Unit form takes one typed number per cube.
- ✅ **One device per staff member** — removes login/PIN entirely from scope; attribution is a one-time device mapping.
- ✅ **Revenue/price tracking deferred** — flagged as "extra" by the owner, fine to add post-MVP.
- ✅ **Offline fallback shows "last known, with date"** rather than nothing.

## Architecture note: why the buyer view needed a backend sooner than planned

The Option A decision (local storage, single device) was scoped for the *staff* screens — New Unit and Scan Out are genuinely fine on one device. The buyer-facing view is a different case: a buyer scans with *their own* phone, which can never share localStorage with the device that logged the cube. There's no "single device" version of that that works at all.

**What got built:** New Unit and Scan Out still write to local storage first (unchanged, still instant, still works offline for staff). Each create/sell now also fires a best-effort write to a small shared store (Upstash Redis via a Vercel Edge Function at `/api/units/[id]`) — if that write fails, the local operation still succeeds, it just means the buyer page won't reflect that unit until the next successful sync. The buyer page (`/u/:id`) reads only from that shared store, with a localStorage cache per unit so a repeat visitor sees "confirmed as of [time]" instead of nothing if the server's unreachable.

This is a small, contained addition, not a rework of what already worked — full offline queueing/retry (build phase 6) is still deferred.

**QR codes now encode the app's actual deployed origin** (`window.location.origin`) rather than a placeholder domain — no manual URL swap needed once this is live on Vercel.

## What's now open

See [requirements-checklist.md](./requirements-checklist.md).

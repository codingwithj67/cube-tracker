# Requirements checklist — go through before continuing

This is what's confirmed, what's still open, and one architecture question worth deciding now rather than after the next screen is built.

## Confirmed so far

- [x] One QR per physical cube (not per SKU) — status-based lifecycle: `IN_STOCK` → `SOLD`
- [x] No restocking workflow — a cube coming out of processing *is* the stock-in event
- [x] Weight is entered manually per cube (no two cubes are the same weight, so no shortcut needed)
- [x] One device per staff member — no login/PIN system needed for the MVP
- [x] Revenue/price per sale is deferred — not in the MVP, added later without rework
- [x] Offline buyer-facing view shows "confirmed as of [date/time]" rather than nothing
- [x] Damaged/lost label recovery: human-readable code fallback + search by date/weight, plus a reissue-tag action

## Where does the data live? — Decided: Option A

**Chosen: single device for now.** Local storage stays as-is; one phone does all the logging and selling for the pilot demo. Fastest path to showing the owner it works.

**Carried forward as a known limitation, not forgotten:** this only works cleanly with one device in play. The moment a second staff member needs to scan from their own phone, this needs to move to a shared backend (Option B from the original write-up) — and that's a data-layer rebuild, not an extension, so it should happen as a deliberate step once multi-device use is actually needed, not discovered as a bug later.

## Questions to bring back to the factory owner

- **Metal types** — is there a fixed, short list of grades he processes (steel, aluminium, copper, etc.), or does it vary enough that free text is safer than a dropdown?
- **Label stock** — what size/material are the physical labels he plans to stick on cubes? The print layout is currently unsized against real label dimensions.
- **Printer** — has he already got a printer in mind, or is that still open? (See the earlier hardware comparison in this conversation — handheld thermal printers like Niimbot/Phomemo were the recommendation for on-demand printing.)
- **Accounting export** — does his accountant need a specific format (e.g. matching an existing spreadsheet or accounting software import), or is a plain CSV of sold units + weights + dates enough?
- **Weight sanity bounds** — is there a realistic min/max weight per cube worth validating against, to catch fat-finger typos (e.g. 4200 instead of 42.0) at entry time?

## Worth checking, not yet confirmed

- **Scrap metal regulations** — many jurisdictions require scrap metal dealers to log seller identity or report transactions, due to metal-theft laws (copper wiring, catalytic converters, etc.). Worth checking whether this applies to his location/business — if it does, the data model may need a seller/source field at the point a cube is logged, not just weight and type. Not assumed to apply; flagging because it's the kind of requirement that's expensive to retrofit if discovered late.

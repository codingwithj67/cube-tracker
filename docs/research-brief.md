# Research brief: can a QR stocktake system work for factories?

*Prepared 15 Aug 2026*

A look at the market, the build, and the pricing for a scan-to-deduct inventory system aimed at small manufacturers — with a twist: the same QR tag doubles as a product card for buyers touring the floor.

## The idea, restated

Every product in the factory gets one QR code. Scanning it at the point of sale deducts one unit from stock automatically — no spreadsheet, no manual count. At year end, the factory has a clean sold/remaining ledger ready to hand to their accountant. The same code, printed on a tag next to the product, also works as a spec sheet when a buyer walks the floor: scan it, see what it is, what it's made of, what's in stock.

That combination — **stocktake tool** and **showroom label** in one code — is the part worth protecting when scoping this. Most existing tools are good at one and ignore the other.

## Market & competitors

QR/barcode inventory tools are a mature category. Nobody needs to invent the concept — they need a reason to switch.

| Tool | From | Built for | Buyer-facing catalog | Where it leaves a gap |
|---|---|---|---|---|
| Sortly | $25/mo | Small teams, visual asset tracking | No | Simple, but no accounting-ready sales ledger or buyer view |
| Zoho Inventory | $59/mo | Order fulfillment, multichannel selling | No | Built for e-commerce ops, not a factory floor — steep for the actual need |
| inFlow Inventory | ~$110/mo (2 users) | Wholesalers, B2B sales | Yes | Closest match feature-wise, but priced/configured for teams, not a single-owner shop floor |
| Fishbowl | Enterprise quote | Large manufacturers, ERP integration | No | Overbuilt — BOM, work orders, lot control most small factories don't need |
| QR Inventory | Custom | Construction, field assets, WIP tracking | No | Tracks materials and equipment, not finished-goods sales for buyers |
| Craftybase | From ~$24/mo | Small-batch makers, COGS tracking | No | Strong on accounting/COGS, weak on floor operations and buyer-facing use |

**The gap:** Nobody is cheaply and simply merging scan-to-deduct stocktaking with a buyer-facing product card. inFlow gets closest with its B2B portal, but it's priced and configured for a sales team, not a factory owner who wants one phone, one QR sheet, and a year-end number for their accountant. That's the wedge: radically simpler than an ERP, more purpose-built than a generic label maker.

Worth noting: the DIY version of this already exists and is free — Google Forms + Sheets + a QR generator can log scans and tally stock with zero software cost. That's the real baseline competitor for price-sensitive factories, not the paid tools. This product has to be worth paying for specifically because it's faster to set up, works properly offline, and looks presentable to a visiting buyer — a spreadsheet link doesn't.

## Technical feasibility

Nothing about this requires new technology — QR generation and camera-based scanning are solved problems. The real engineering questions are around **offline reliability** (factory floors have patchy wifi) and keeping setup to a few minutes per product.

**Flow:** owner adds a product → gets an auto-generated QR tag to print → staff scans the tag on sale, stock decrements → scan queues locally if offline, syncs when back online → buyer scans the same tag to see product info + live stock.

**Recommended stack for a lean MVP:**
- **Scanning** — browser-based via `html5-qrcode`, reads QR and common barcode formats, runs entirely client-side, no app install required.
- **Client** — a PWA (installable web app) rather than a native app — one codebase, no app-store approval.
- **Offline** — local storage queues scans when there's no signal; background sync pushes them once reconnected. Non-negotiable for shop-floor reliability.
- **Backend** — a straightforward database (product, stock level, scan log tables) behind a small API is enough at this scale.

**Rough cost bands:** $0 for a DIY pilot (Sheets + Forms + free QR generator) → a lean custom-built MVP (buildable solo or with a small team in weeks) → $10k–50k for commercial-grade with ERP integration (Fishbowl/inFlow-scale).

## Business model & pricing

Small-manufacturer inventory budgets cluster around **$50–300/month**, and buyers actively resent per-seat pricing when the "team" is a few people sharing one phone.

**Suggested model:** flat pricing per factory location, not per user — e.g. a single tier around $30–60/month covering unlimited staff scans up to a SKU cap, with a higher tier for multi-line factories. A free tier capped at ~25 products lets an owner pilot it on one product line before paying, competing directly against the "just use Sheets" default.

Two things worth building the pricing story around from day one:
- **A year-end export** formatted for handing straight to an accountant — the concrete, recurring pain point that justifies paying instead of using free tools.
- **The buyer-facing scan view** — the differentiator competitors don't offer at this price point.

*(Note: pricing work is intentionally deferred until an MVP is viable and validated with the factory owner — see [requirements-checklist.md](./requirements-checklist.md).)*

## Open questions raised at research stage

- Who exactly are "the buyers" who visit the factory — domestic or international/export? *(Resolved for this build: not applicable — this factory sells processed scrap metal, not a buyer-showroom product line in the original sense. See mvp-scope.md.)*
- How reliable is factory-floor connectivity?
- Who's doing the scanning, and how comfortable are they with a phone app? *(Resolved: one device per staff member, no shared-device login needed.)*
- Does "minus from the system" need to handle partial units, batches, or variants? *(Resolved: one QR per physical unit — see mvp-scope.md.)*

## Sources

- [Top 7 QR Code Inventory Management Systems & Apps — AppsRhino](https://www.appsrhino.com/blogs/top-qr-code-inventory-management-system)
- [How to Use QR Codes for Inventory Management — Craftybase](https://craftybase.com/blog/inventory-management-using-qr-codes)
- [Sortly vs Zoho Inventory — SpotSaaS](https://www.spotsaas.com/compare/sortly-vs-zoho-inventory)
- [Zoho Inventory vs Sortly — Softr](https://www.softr.io/blog/zoho-inventory-vs-sortly)
- [The Essential Barcode Inventory Apps Guide — Descartes Finale](https://www.finaleinventory.com/guides/barcode-inventory-app/)
- [How Much Does Inventory Management Software Cost — inFlow](https://www.inflowinventory.com/blog/inventory-management-software-cost/)
- [Inventory Management Software Cost — Brahmin Solutions](https://www.brahmin-solutions.com/blog/what-is-the-average-cost-of-an-inventory-management-system)
- [Building a QR Code Inventory Tracker with Google Sheets — Statology](https://www.statology.org/building-a-qr-code-inventory-tracker-with-google-sheets/)
- [Wholesale Inventory Software — inFlow](https://www.inflowinventory.com/use-cases/wholesale-software)
- [html5-qrcode — GitHub](https://github.com/mebjas/html5-qrcode)
- [Why HTML5-QRCode Is the Leading JavaScript QR Scanner Library — ScanApp](https://scanapp.org/blog/2026/05/24/is-html5-qrcode-the-best-javascript-scanner-library.html)

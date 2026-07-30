# Changes After Handover from Raju's Team

All changes below were made by **classicShumba** after merging Raju/Nilanchal9437's initial build (`d3eebaa`).

---

## Cloudflare Workers Deployment Setup — Jun 5–7

The app was built for Node.js/Vercel. These changes made it deployable to Cloudflare Workers.

### `1d856bb` — Add wrangler.toml and fix CF deployment config
- Created `wrangler.toml` targeting `dtel.co.zw` zone
- Worker name: `sales-engine`
- Static assets bound as `ASSETS`

### `e5a78e9` — Add @opennextjs/cloudflare, fix wrangler entry-point
- Installed `@opennextjs/cloudflare` (OpenNext adapter)
- Fixed wrangler entry-point to use the CF-compiled worker output

### `dafeaa7` — Add open-next.config.ts
- Required config file for `@opennextjs/cloudflare` build pipeline

### `23788cb` — Disable next/image optimization for CF Workers
- `next.config.ts`: set `images.unoptimized: true`
- CF Workers runtime has no image optimization support

### `989d67e` — Add ASSETS binding to wrangler.toml
- Without `ASSETS` binding, static files (JS, CSS, fonts) returned 404s on Workers

---

## Voucher JWT / Private Key — Jun 7

Vouchers use RS256 JWTs. The app originally read the private key from disk — impossible on CF Workers (no filesystem).

### `62f6c7a` — Replace fs.readFileSync with env var
- `src/libs/generateToken.ts`: read key from `PRIVATE_KEY_PEM` env var instead of `keys/private_pkcs8.pem`

### `d3e7602` — Fix voucher token generation
- Was calling itself via HTTP (`localhost/apis/generate-token`) — fails on CF Workers (no self-referencing HTTP)
- Replaced with direct `generateToken()` call

### `ef09620` — Normalize PRIVATE_KEY_PEM newlines
- CF dashboard strips `\n` from secret values when saved via UI
- Added PEM header/footer re-insertion + newline normalization

### `8f84e5e` — Robustly reconstruct PEM
- Handles all CF stripping variants: literal `\n`, space-separated, fully concatenated
- Regex-based line chunking into 64-char PEM lines

---

## Odoo Integration Fixes — Jun 7–8

### `6acaf57` — Fix Odoo auth header, wizard IDs, zimswitch URLs, plan pricing
- Corrected Odoo `Authorization: Bearer` header format
- Fixed `sale.advance.payment.wizard` ID field name
- Fixed ZimSwitch redirect and callback URL construction
- Fixed plan price display (was not reading correct field from Odoo response)

### `6ba8d9d` — Make entire plan card clickable
- Previously only the radio button triggered plan selection
- Wrapped card in click handler so any tap/click selects the plan

### `1e0bd1a` — Fix invoice generation
- `create_invoices` Odoo response was missing `id` field
- Invoice post + reconcile calls were failing silently
- Fixed by reading `res.data.result` correctly

### `d9dfc36` — Filter Mobile from product categories API
- `app/apis/get-home-category/route.ts`: added domain filter `["complete_name", "!=", "Mobile"]`
- Mobile not yet live — excluded from landing page service selector

### `a654375` — Fix webhook and return URLs on CF Workers
- `API_BASE_URL` env var was not being used — URLs were resolving to `localhost`
- All payment webhook and return URLs now use `process.env.API_BASE_URL`

### `9d87355` — Rename echoCash → ecocash
- Inconsistent casing across files, directories, and URL paths
- Renamed 8 files, updated all imports and API route paths

---

## Configuration — Jun 10

### `e8599fb` — Shopify store URL to env var
- Hardcoded Shopify URL replaced with `NEXT_PUBLIC_SHOPIFY_STORE_URL`

### `787501b` — Add CF for SaaS fallback origin worker route
- Added `wrangler.toml` worker route for SaaS fallback origin

### `bb4c1be` — Fix CF for SaaS routing with wildcard route
- Wildcard route `*/*` required for CF for SaaS to route correctly
- Previous specific route pattern was not matching all request paths

---

## Equipment & Fee Pane — Jun 11

### `cc8d132` — Dynamic installation and delivery fee panes on equipment page

New API route + component for optional product fees:

- `app/apis/get-optional-products/route.ts`: 3-step Odoo lookup — product variant → template → `optional_product_ids`
- `src/components/FeePane/index.tsx`: collapsible fee selection pane, styled to match equipment UI
- Equipment pages (home + business): fetch fees on mount, pre-select Installation Fee, Delivery Fee is user-togglable
- Selected fees stored in `optionalFees` URL param and added as order lines in checkout
- Affects: `src/features/homeInternet/equipment/index.tsx`, `src/features/businessInternet/equipment/index.tsx`, both checkout flows

---

## Checkout & Payment Fixes — Jun 11

### `cd2b742` — Fix payment amounts, equipment null display, optional fees in checkout summary

**Payment amounts:**
- EcoCash and ZimSwitch were sending hardcoded `amount: 0.01` to payment provider
- Now computes total from: plan price + equipment price + vouchers + optional fees + business variant pricing

**Equipment null display:**
- Layout files and payment layouts were rendering literal "null" string when no equipment selected
- Added guard: `param === "null" ? null : param` across all layout files

**Optional fees in sidebar:**
- `HomePaymentLayout` and `BusinessPaymentLayout` were missing `optionalFees` rendering
- Added fee rows to checkout sidebar summary

**SummaryPlan pricing:**
- Filtered out "Included" items from price subtotal
- Guarded NaN values from missing/undefined params
- Zero-price equipment now shows "Included" badge instead of "ZWG 0.00"

**Review page fixes:**
- Business review total was using `.00` hardcoded suffix → replaced with `.toFixed(2)`
- Home review NaN when `voucherPrice` param was string `"null"` → guarded

**EcoCash number field:**
- Renamed `echocashNumber` → `ecocashNumber` across all checkout and payment files

---

## UX & Data Improvements — Jun 12

### `fe985b2` — Address autofill, voucher categories, plan ordering

**Address display:**
- Location steps were passing Google autocomplete text (e.g. "14 Samora Machel...") to plan page
- Coverage API already returns validated full address (`coverage.address`)
- Now URL param uses `coverage.address` so plan/review/checkout pages show full backend-validated address
- Both home and business location steps updated

**Google Places API migration:**
- Deprecated `AutocompleteService` replaced with new `AutocompleteSuggestion` API (Fetch-based)
- Added session token management via `useRef` for billing efficiency

**Voucher categories — dynamic:**
- `extras/index.tsx` (home + business) had 4 hardcoded `useState` vars (`entertainment`, `shopping`, `gaming`, `security`) with static filter/render logic
- Replaced with single `groupedVouchers: Record<string, Voucher[]>` state
- Grouped dynamically by `metadata.group` from API response
- Section titles driven by `metadata.group_label`
- New voucher categories from Odoo appear automatically without code changes

**Voucher empty state:**
- When API returns no vouchers, shows "Coming Soon" panel instead of empty grids

**Business extras:**
- Consumer-only groups (`entertainment`, `gaming`) excluded from business internet extras

**Plan ordering:**
- `app/apis/get-product-categories/route.ts`: was sorting by `a.id - b.id` (Odoo DB ID)
- FWA had lower Odoo ID than Fiber → FWA appeared first
- New sort: Fiber → FWA → LTE (priority map, anything else falls to end)

### `98a1814` — Fix equipment name duplication + Google Places new API

**Equipment name duplication:**
- Payment summary showed "FWA FWA Home Equipment Rental" / "Fiber Dolphin Business Elite"
- Bug in `HomePaymentLayout` and `BusinessPaymentLayout`: first branch concatenated `equipmentCategoryName + productName` instead of preferring `productName`
- Fixed to: `productName ?? equipmentCategoryName` pattern (matches correct branch already used elsewhere)

**Google Places migration** (same work as `fe985b2` — duplicated across commits due to rebase):
- Both home and business location steps now use `AutocompleteSuggestion` with session tokens

### `b27bc6d` — Update metadata for Dolphin Telecoms
- `app/layout.tsx`: replaced "Dolphin Pay" branding
- New title: "Dolphin Telecoms | Connectivity for Every Part of Your Life"
- Updated description, keywords, authors, Open Graph tags

### `5b1853b` — Favicons, manifest, restore mobile service card

**Favicons:**
- Replaced placeholder favicon with full Dolphin Telecoms icon set
- `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png` (Next.js App Router convention)
- `public/favicon-96x96.png`, `public/web-app-manifest-192x192.png`, `public/web-app-manifest-512x512.png`
- `public/site.webmanifest` with PWA metadata

**Mobile service card:**
- `app/apis/get-home-category/route.ts`: removed domain filter that excluded Mobile
- Mobile category now fetched dynamically from Odoo like Home/Business
- If Odoo returns no Mobile category, landing page shows "Coming Soon" disabled card as fallback
- `src/features/connect/components/index.tsx`: `hasMobile` check drives fallback injection

### `b77b54b` — Fix equipment name display and plan-as-equipment bug

**Review sidebar equipment name:**
- `src/components/Layout/BusinessInternet.tsx` had same concatenation bug as payment layouts
- Fixed equipment title to prefer `productNameEquipment` over `equipmentName`

**Plan-as-equipment bug:**
- `app/apis/get-product-equipment/route.ts`: when `x_equipment_ids` was empty, returned `[{ ...productsResponse, equipments: [] }]`
- This put the service plan template as a selectable "equipment" item in the UI
- Fixed: return `productAttributes = []` when no equipment IDs exist

### `eba4130` — Scope Odoo search_read to required fields only

All `search_read` calls were returning full Odoo records (40+ fields per record). Added `fields` arrays to every call across 8 API routes:

| Route | Fields added |
|---|---|
| `get-home-category` | `id, name, display_name, x_studio_label` |
| `get-product-categories` | category + template + attribute.line + attribute.value + variant |
| `get-business-product` | same as above |
| `get-mobile-product` | template + attribute.line + attribute.value |
| `get-product-equipment` | category + template + equipment variant chain |
| `get-product-attribute-value` | `id, name, attribute_id` |
| `get-voucher-product` | `id, name, display_name, product_tmpl_id` |
| `get-airtime-product` | minimal fields for airtime product |

### `9bd497c` — Fix product_variant_id field + add description

**product_variant_id crash:**
- After field scoping, `product_variant_id` (singular Many2One) was missing from `product.template` field list
- Plan components access `product.product_variant_id[0]` → was crashing with `Cannot read properties of undefined`
- Added `"product_variant_id"` to all 3 product template field lists

**Description field:**
- Added `"description"` to product.template fields
- Plan card UI already had description rendering wired up — was just getting `undefined` from Odoo

### `0d8afb7` — Fix implicit any[] TypeScript build error

- `app/apis/get-product-equipment/route.ts` line 30: `let productAttributes = []`
- TypeScript infers `never[]` when array is declared empty and reassigned in two separate branches
- Fixed: `let productAttributes: any[] = []`

---

## Icon System — Jun 12 (uncommitted)

### Replace all emojis with react-icons

Replaced every emoji used as UI elements across 16 files with proper react-icons components. No emojis remain in `.tsx`/`.ts` source files.

**Icon mapping:**

| Emoji | Context | react-icon |
|---|---|---|
| 🏠 | Plan summary sidebar — selected service | `FiHome` |
| 📍 | Plan summary sidebar — address | `FiMapPin` |
| 📡 | Plan summary sidebar — connection type | `LuRadio` |
| 📦 | Plan summary sidebar — equipment; equipment "included" card | `FiPackage` |
| 🛜 | Plan summary sidebar — equipment variant | `FiWifi` |
| 💰 | Plan summary sidebar — fees | `FiDollarSign` |
| ✓ | Coverage success indicator | `FaCheck` |
| ✕ | Coverage failure indicator | `LuX` |
| ✓ | Plan option / equipment variant selected state | `FaCheck` |
| ✓ | Service card selected state | `FaCheck` |
| ✓ Bundle Active | Extras mobile bundle button | `<FaCheck /> Bundle Active` |
| 📱 | Extras mobile bundle promo card | `FiSmartphone` |
| 🎉 | Payment success celebration | `BsStars` |

**Layout files updated** (all 4):
- `icon` field type changed from `string` to `ReactNode` in `ItemType` interface
- Added imports: `FiHome, FiMapPin, FiPackage, FiWifi, FiDollarSign` from `react-icons/fi`; `LuRadio` from `react-icons/lu`

**Feature files updated** (12 files):
- `homeInternet/location`, `businessInternet/location`
- `homeInternet/equipment`, `businessInternet/equipment`
- `homeInternet/equipment/equipmentVariant`, `businessInternet/equipment/equipmentVariant`
- `homeInternet/plan`, `businessInternet/plan`
- `homeInternet/extras`, `businessInternet/extras`
- `businessInternet/payment-success`
- `src/components/Services/card`

---

## wrangler.toml Logging — Jun 7

### `f4fba8c` — Enable logs and invocations in wrangler.toml
- Added `[observability]` config with `enabled = true`
- Note in commit: to be disabled on live env

---

---

## Equipment & Setup Page — Jun 15

Three interrelated improvements to how equipment is selected, priced, and displayed across the wizard.

---

### 1. Dynamic Installation Fee — Tied to Rental Equipment via Odoo

**Background.** The business decision was made to charge an installation fee only when a customer selects rental equipment. For owned (upfront) equipment, no installation fee applies. This is now managed entirely in Odoo — not hardcoded in the application.

**How it works in Odoo:**
- Rental equipment product template (e.g. "Fibre ONT — Rental") has one or more products listed under **Sales → Optional Products**. The installation fee product lives there.
- Upfront/owned equipment templates have no optional products linked.

**What the app now does:**
1. When the user selects a piece of equipment, the app calls `/apis/get-optional-products` with the selected equipment variant's Odoo ID.
2. That API resolves the variant's parent template, then reads `optional_product_ids` from Odoo.
3. If optional products exist and include an installation fee, a fee pane appears below the equipment cards.
4. If the user switches to upfront equipment (no optional products), the installation fee pane disappears and is removed from the order.

**Previously:** The `get-product-equipment` API was not fetching the `recurring_invoice` field from Odoo, so the app could never distinguish rental from upfront equipment. The fee lookup was also using the plan's product ID instead of the selected equipment's product ID, meaning the wrong products were being queried.

**Files changed:**
- `app/apis/get-product-equipment/route.ts` — added `"recurring_invoice"` to the `product.product/search_read` fields list
- `src/features/homeInternet/equipment/index.tsx` — `fetchOptionalProducts()` now takes an equipment variant ID parameter; reactive effect re-fetches when user changes equipment selection; clears fees (and removes them from URL) when switching to equipment with no optional products
- `src/features/businessInternet/equipment/index.tsx` — same changes

---

### 2. Per-Month Pricing — Data-Driven, Not Hardcoded

**Background.** The `/mo` label on equipment cards was previously hardcoded. This meant all equipment appeared to be monthly regardless of whether it was a subscription or a one-off purchase.

**How it works in Odoo:**
- Each `product.product` record has a boolean field `recurring_invoice`.
- `true` = subscription/rental (monthly billing)
- `false` = one-time upfront purchase

**What the app now does:**
- Reads `recurring_invoice` from the Odoo API response for each equipment variant.
- Displays `$XX/mo` only when `recurring_invoice` is `true`.
- Displays `$XX` (no suffix) when `recurring_invoice` is `false`.
- Shows `"Included"` when price is `0`.
- Sets `planId=1` in the Odoo sale order only for rental equipment — this triggers recurring billing in Odoo. Cleared from the order when upfront equipment is selected.

**Example (from Odoo data):**

| Product | `recurring_invoice` | Display |
|---|---|---|
| Fibre ONT — Rental (template 566, variant 575) | `true` | `$50/mo` |
| Fibre ONT — Own (template 560, variant 569) | `false` | `$120` |

**Files changed:**
- `src/features/businessInternet/equipment/equipmentVariant.tsx` — price display now reads `plan.recurring_invoice` instead of hardcoded `/mo`; `planId` URL param set/cleared based on this field
- `src/features/homeInternet/equipment/equipmentVariant.tsx` — same changes

---

### 3. Equipment Card UX — Whole-Card Click & Live Prices

**What changed:**

**Prices visible immediately.** Cards previously showed "Select to see pricing" until the user clicked. Prices now display on page load for every card, regardless of selection state.

**Whole card is clickable.** Previously only the small radio button circle was the click target. Now clicking anywhere on the card selects it — consistent with how the "Choose Your Plan" step works. Selection is radio-button style: once a card is selected, clicking it again does nothing. Users must pick one option if equipment is available.

**Equipment appears in "Your Plan Summary" sidebar live.** When the user selects equipment, the sidebar now updates immediately to show the equipment name and price. Previously this only appeared after navigating away from the equipment page.

**Equipment data carried through to review and checkout.** This was a bug: the app was building the navigation URL using a stale copy of URL parameters (from `useSearchParams()`), which does not reflect changes made via `window.history.replaceState`. Equipment variant ID, price, name, subscription flag, and attribute selections were all being dropped when the user clicked "Continue." Fixed by reading `window.location.search` directly at navigation time.

**Files changed:**
- `src/features/businessInternet/equipment/equipmentVariant.tsx`
- `src/features/homeInternet/equipment/equipmentVariant.tsx`
- `src/features/businessInternet/equipment/index.tsx`
- `src/features/homeInternet/equipment/index.tsx`
- `src/components/Layout/BusinessInternet.tsx`
- `src/components/Layout/HomeInternet.tsx`

---

*Document covers commits `62f6c7a` through HEAD (post-handover from Raju/Nilanchal9437). Last updated 2026-06-15.*

# Requirements Checklist (Incomplete)

Last updated: 2026-01-07

This document lists **incomplete** Functional Requirements (**FRs**) and Non‑Functional Requirements (**NFRs**) for both backend (Django/DRF) and frontend (React/Vite).

## Tracking (Next Up)

Use this short list for day-to-day progress. The full checklist continues below.

- [x] Backend: validate money fields in checkout (non-negative values; prevent invalid totals).
- [x] Backend: add cart quantity update endpoint (set/increment/decrement) and align UI.
- [x] Frontend: implement real product detail page (fetch by slug + add-to-cart + variants).
- [x] Frontend: implement real checkout form (addresses + totals + confirmation).

---

## Backend (Django/DRF)

### FRs (Functional Requirements)

**Checkout / Orders**
- [x] Support selecting cart items in API docs and requests (document `item_ids` for `POST /api/v1/orders/create_from_cart/`).
- [x] Validate `item_ids` errors clearly (e.g., if IDs are invalid/not in user cart, return a specific error instead of collapsing into “Cart is empty”).
- [x] Compute totals safely server-side (guard against negative `shipping_cost`, `tax`, `discount`, and enforce `total >= 0`).
- [ ] Enforce required checkout fields (if your business rules require shipping/billing addresses, validate and error when missing).
- [ ] Stock enforcement at checkout (verify stock for product/variant and prevent oversell).
- [ ] Order detail endpoints should include consistent, complete data needed by UI (items, product snapshots, totals, addresses).
- [ ] Order lifecycle beyond `cancel` (refund/return, status transitions like paid/shipped/delivered, admin update actions).

**Payments**
- [x] Payment creation/processing API (currently payments are read-only; no “pay for order” flow).
- [ ] Payment status updates tied to order state (paid/failed/refunded) + audit trail.

**Cart**
- [x] Update quantity / set quantity endpoint (currently only add/increment, remove, clear).
- [x] Decrement quantity (optional) or remove when quantity reaches 0.
- [x] Make `clear` robust when cart doesn’t exist yet (avoid 500 if cart record missing).

**Products**
- [ ] Ensure product detail serialization supports the UI needs (images, variants, attributes) and remains stable.

**Reviews**
- [ ] Allow authenticated users to manage their review safely (update/delete rules and object-level permissions).
- [ ] Moderation/admin approval flow (currently API filters `is_approved=True` but does not expose an approval workflow).

**Notifications**
- [ ] Decide whether notifications are user-writable; if not, lock down create/update/delete (currently `ModelViewSet` allows full CRUD).
- [ ] Add ordering on notification querysets to avoid pagination warnings and to show newest first.

**Auth / Accounts**
- [ ] Password reset / change password.
- [ ] Email verification flow (field exists in UI response, but no verify endpoint/flow).

### NFRs (Non‑Functional Requirements)

**Security**
- [ ] Do not trust client-provided money fields by default; validate/compute totals on server.
- [ ] Add throttling/rate limiting (API docs mention rate limits, but DRF throttling is not configured in settings).
- [ ] Ensure object-level permission checks everywhere (especially admin APIs and any write endpoints).

**Reliability & Data Integrity**
- [ ] Make checkout atomic and consistent under concurrency (stock checks + order creation + cart mutation).
- [ ] Consistent Decimal rounding rules (currency precision) and input validation.

**Performance**
- [ ] Avoid N+1 queries in serializers (use `select_related`/`prefetch_related` systematically for list/detail endpoints).

**Observability**
- [ ] Structured logging for checkout/payment failures; consistent error shapes.

**Documentation**
- [ ] Keep backend docs aligned with actual endpoints (`/api/v1/accounts/token/` vs older examples; add `item_ids` to `create_from_cart`).
- [ ] Define webhook plan (API docs say “Coming soon”).

**Testing**
- [ ] Add API tests for: create_from_cart with `item_ids`, empty selection, invalid IDs, cancel rules, cart quantity behavior.

---

## Frontend (React/TypeScript)

### FRs (Functional Requirements)

**Product Detail**
- [x] Implement real product detail screen (fetch by slug, show images/description/variants/attributes).
- [x] Add-to-cart from product detail (including variant selection if variants exist).
- [x] Reviews UI on product detail (list reviews, create/update review).

**Checkout**
- [x] Replace “starter” checkout with a real checkout form (shipping address selection/entry, billing address, notes).
- [x] Show computed totals (subtotal/shipping/tax/discount/total) using server-side values (not only client sums).
- [x] Payment method selection + payment submission flow.
- [x] Order confirmation screen (success state with order number/details).

**Orders**
- [ ] Order detail page (items, totals, addresses, status history).
- [ ] Cancel order action in UI (wire to `POST /api/v1/orders/{id}/cancel/`) with proper state updates.

**Cart**
- [x] Quantity editing UI (increase/decrease/set) and sync with backend endpoints.
- [ ] Selected subtotal display (for selected items) and clearer messaging when selected items are removed/changed.

**Account / Addresses**
- [ ] Address CRUD UI (add/edit/delete, set default) to match backend `addresses` viewset.
- [ ] Profile editing UI (if desired) to match backend user/profile endpoints.

**Payments**
- [x] Payment initiation UI (current page only lists existing payments).

**Notifications**
- [ ] Mark single notification read in UI (backend supports it; UI only “mark all”).

### NFRs (Non‑Functional Requirements)

**UX Consistency**
- [ ] Remove/replace stale “Starter page” copy in pages that are already functional (e.g., login uses real token endpoint).
- [ ] Standardize empty/loading/error states across pages.

**Accessibility**
- [ ] Ensure all form controls have labels, focus states, and keyboard navigation; add `aria-*` where appropriate.

**Reliability**
- [ ] Guard against stale query params (e.g., `/checkout?items=...` when cart changes) with clear UX.
- [ ] Centralize auth-expiry handling (401 → logout/redirect) consistently across API calls.

**Performance**
- [ ] Add pagination/search UI for product lists when product count grows (backend already supports pagination).

**Type Safety & Maintainability**
- [ ] Replace remaining broad `unknown`/`Record<string, unknown>` types with concrete API models where feasible.
- [ ] Add basic UI tests for critical flows (cart selection → checkout → order created).

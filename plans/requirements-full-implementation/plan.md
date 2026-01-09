# Requirements.md Full Implementation

**Branch:** `feat/requirements-md-full-implementation`
**Description:** Implement all currently-unchecked items in `REQUIREMENTS.md` to make the e-commerce app fully functional end-to-end (backend + frontend + tests + telemetry + docs).

## Goal
Ship a production-ready e-commerce experience by completing the remaining backend/DRF, frontend/React, testing, documentation, and OpenTelemetry items tracked in `REQUIREMENTS.md` (Last updated: 2026-01-08).

## Traceability (REQUIREMENTS.md → Implementation Steps)

This table maps each currently-unchecked item in `REQUIREMENTS.md` to the step(s) in this plan that implement it, plus the primary backend endpoint(s) and frontend route/component(s) involved.

| REQ Section | Requirement (unchecked) | Plan Step(s) | Backend (endpoints / areas) | Frontend (routes / components) |
|---|---|---:|---|---|
| Documentation | Keep backend docs aligned with actual endpoints (`/api/v1/accounts/token/` vs older examples; add `item_ids` to `create_from_cart`). | 1 | `backend/docs/API.md`, `backend/config/urls.py`, `backend/apps/accounts/urls.py`, `backend/apps/orders/views.py` | N/A |
| UX Consistency | Remove/replace stale “Starter page” copy in pages that are already functional (e.g., login uses real token endpoint). | 1 | N/A | `frontend/src/pages/account/LoginPage.tsx` |
| Frontend / Admin Portal | Frontend: document frontend routes/components and surface them in the admin portal docs view. | 10 | `backend/apps/admin_api/docs_views.py` (+ docs sources under `backend/docs/`) | `frontend/src/admin/**` |
| Frontend / Home | Replace starter home content with real storefront entry points (featured products, categories/brands, or promotions). | 2 | `GET /api/v1/products/`, `GET /api/v1/products/categories/`, `GET /api/v1/products/brands/` | `/` landing page (`frontend/src/pages/**`) |
| Frontend / Home | Modernize landing page UI (layout, spacing, typography) without changing features. | 2 | N/A | `/` landing page (`frontend/src/pages/**`) |
| Frontend / Products / Browse | Add search input UI (wired to backend `search=`) and persist query in URL. | 3 | `GET /api/v1/products/?search=` | products list page + URL query sync (`frontend/src/features/products/**`) |
| Frontend / Products / Browse | Add sorting UI (wired to backend `ordering=`). | 3 | `GET /api/v1/products/?ordering=` | products list page (`frontend/src/features/products/**`) |
| Frontend / Products / Browse | Add filter UI for category/brand (wired to backend query params). | 3 | `GET /api/v1/products/?category=&brand=` | products list page (`frontend/src/features/products/**`) |
| Frontend / Products / Browse | Add pagination UI (page/page_size) and show current/next/prev. | 3 | `GET /api/v1/products/?page=&page_size=` | products list page (`frontend/src/features/products/**`) |
| Frontend / Products / Browse | Improve product cards (primary image, sale badge, compare price) where available. | 3 | `GET /api/v1/products/` response fields | product grid/cards (`frontend/src/features/products/**`) |
| Frontend / Products / Browse | Modernize products listing UI (grid responsiveness, card hierarchy, loading states). | 3 | N/A | product list UI (`frontend/src/features/products/**`) |
| Frontend / Product Detail | Modernize product detail UI (media gallery layout, variant selection UX, spacing). | 4 | `GET /api/v1/products/{slug}/` | product detail page (`frontend/src/features/products/**`) |
| Frontend / Orders | Cancel order action in UI (wire to `POST /api/v1/orders/{id}/cancel/`) with proper state updates. | 5 | `POST /api/v1/orders/{id}/cancel/` | order detail page (`frontend/src/features/orders/**`) |
| Frontend / Orders | Show payments for an order (if payments exist) on the order detail page. | 5 | `GET /api/v1/orders/{id}/` (and/or payments endpoints) | order detail page (`frontend/src/features/orders/**`) |
| Frontend / Cart | Selected subtotal display (for selected items) and clearer messaging when selected items are removed/changed. | 6 | cart endpoints under `/api/v1/cart/` | cart page (`frontend/src/features/cart/**`) |
| Frontend / Account / Addresses | Address CRUD UI (add/edit/delete, set default) to match backend `addresses` viewset. | 7 | `GET/POST /api/v1/accounts/addresses/`, `GET/PATCH/DELETE /api/v1/accounts/addresses/{id}/` | account pages (`frontend/src/features/account/**`) |
| Frontend / Account / Addresses | Profile editing UI (if desired) to match backend user/profile endpoints. | 7 | accounts endpoints under `/api/v1/accounts/` | account pages (`frontend/src/features/account/**`) |
| Frontend / Account / Addresses | Password change UI (if backend supports it). | 7 | accounts endpoints under `/api/v1/accounts/` | account pages (`frontend/src/features/account/**`) |
| Frontend / Notifications | Mark single notification read in UI (backend supports it; UI only “mark all”). | 8 | `POST /api/v1/notifications/{id}/mark_as_read/` | notifications page (`frontend/src/features/notifications/**`) |
| Frontend / Notifications | Add an "Unread only" toggle (optional) or clear visual distinction for unread items. | 8 | `GET /api/v1/notifications/` | notifications page (`frontend/src/features/notifications/**`) |
| Frontend / NFR / UX Consistency | Standardize empty/loading/error states across pages. | 9 | N/A | shared UI (`frontend/src/shared/**`) + pages |
| Frontend / NFR / UX Consistency | Make authenticated navigation consistent across roles (admin vs non-admin) and across pages. | 9 | N/A | layouts/nav (`frontend/src/layouts/**`) |
| Frontend / NFR / Accessibility | Ensure all form controls have labels, focus states, and keyboard navigation; add `aria-*` where appropriate. | 9 | N/A | shared + pages |
| Frontend / NFR / Reliability | Guard against stale query params (e.g., `/checkout?items=...` when cart changes) with clear UX. | 9 | N/A | checkout/cart pages |
| Frontend / NFR / Reliability | Centralize auth-expiry handling (401 → logout/redirect) consistently across API calls. | 9 | 401 responses from API | `frontend/src/api/http.ts` + routing |
| Frontend / Type Safety & Maintainability | Replace remaining broad `unknown`/`Record<string, unknown>` types with concrete API models where feasible. | 9 | N/A | `frontend/src/api/**` + features |
| Frontend / Testing Levels | Unit tests / Integration tests / E2E tests for critical flows. | 17 | N/A | `frontend/src/test/**` + e2e framework |
| Backend / OpenTelemetry (Admin Portal - Backend) | Implement all unchecked admin backend OTEL items. | 14 | `backend/apps/admin_api/**`, `backend/utils/*telemetry*`, `backend/utils/*otel*` | N/A |
| Admin Portal - Frontend OTEL | Implement all unchecked admin frontend OTEL items. | 15 | N/A | `frontend/src/admin/**` |
| Documentation | Define webhook plan (API docs say “Coming soon”). | 18 | docs under `backend/docs/` | N/A |
| Backend Testing Levels | Unit tests / Integration tests / E2E tests for critical user journeys through HTTP. | 13 | `backend/apps/**/test_*.py`, `backend/tests/**` | N/A |
| Backend coverage backlog | Add API tests for: create_from_cart with `item_ids`, empty selection, invalid IDs, cart quantity behavior. | 13 | `backend/apps/orders/**` | N/A |
| Backend coverage backlog | Add API tests for payments: create_for_order ownership, invalid method, cancelled order. | 13 | `backend/apps/payments/**` | N/A |

## Implementation Steps

### Step 1: Requirements traceability + docs alignment (commit 1)
**Files:** `REQUIREMENTS.md`, `Readme.md`, `backend/Readme.md`, `backend/docs/*`, `backend/config/urls.py`, `backend/apps/*/urls.py`, `frontend/src/**`
**What:**
- Create a short traceability section inside this plan (or a small checklist table at the top of the PR description) mapping each unchecked requirement → the backend endpoint(s) + frontend route/component(s) that implement it.
- Fix doc drift called out in `REQUIREMENTS.md` (notably endpoint examples like `/api/v1/accounts/token/` and `item_ids` for `create_from_cart`) so docs reflect real routes and payloads.
- Remove/replace stale “Starter page” copy in any functional pages (notably login).
**Testing:**
- Manual: confirm documented routes exist in Django URLconf.
- Manual: open login page and verify copy no longer claims “starter”.

### Step 2: Frontend landing page (commit 2)
**Files:** `frontend/src/pages/**`, `frontend/src/features/**`, `frontend/src/layouts/**`, `frontend/src/shared/**`
**What:**
- Replace starter home content with real storefront entry points (featured products and/or categories/brands and/or promotions) without introducing new feature scope.
- Modernize landing page UI (layout/spacing/typography) without changing features.
**Testing:**
- Manual: load `/` and validate it renders real storefront entry points.
- Frontend tests: add/update a basic smoke test for the landing page render (if test harness exists).

### Step 3: Products browse UI (search/sort/filter/pagination) (commit 3)
**Files:** `frontend/src/pages/**`, `frontend/src/features/products/**`, `frontend/src/api/**`, `frontend/src/shared/**`
**What:**
- Add a search input wired to backend `search=` and persist it in the URL.
- Add sorting UI wired to backend `ordering=`.
- Add filter UI for category/brand wired to backend query params.
- Add pagination UI (page/page_size) and show current/next/prev.
- Improve product cards to display primary image and pricing/sale metadata where available.
- Modernize listing UI and loading states.
**Testing:**
- Frontend integration tests with mocked API: query params in URL, pagination navigation, loading/error.
- Manual: confirm API requests include correct query params.

### Step 4: Product detail UI modernization (commit 4)
**Files:** `frontend/src/pages/**`, `frontend/src/features/products/**`, `frontend/src/shared/**`
**What:**
- Modernize product detail UI (gallery layout, variant selection UX, spacing) without adding new features.
**Testing:**
- Manual: open a product with variants and validate selection + add-to-cart still works.

### Step 5: Orders UI missing actions (cancel + payments display) (commit 5)
**Files:** `frontend/src/pages/**`, `frontend/src/features/orders/**`, `frontend/src/api/**`
**What:**
- Implement Cancel order UI wired to `POST /api/v1/orders/{id}/cancel/`, with correct disabled states and optimistic/refresh behavior.
- Show payments for an order on the order detail page (if payments exist in API response; otherwise extend API response in a later backend step).
**Testing:**
- Frontend integration tests: cancel success, cancel forbidden/invalid state, error message rendering.
- Manual: cancel an order and verify status updates.

### Step 6: Cart UX completion (selected subtotal) (commit 6)
**Files:** `frontend/src/pages/**`, `frontend/src/features/cart/**`, `frontend/src/shared/**`
**What:**
- Add selected subtotal display for selected items.
- Improve messaging when selected items are removed/changed.
**Testing:**
- Unit tests for subtotal calculation.
- Manual: select/deselect items and confirm totals/messaging.

### Step 7: Account navigation + profile/addresses/password UI (commit 7)
**Files:** `frontend/src/layouts/**`, `frontend/src/pages/**`, `frontend/src/features/account/**`, `frontend/src/api/**`
**What:**
- Ensure logged-in navigation shows Profile, Settings, Logout for all authenticated users (non-admin included).
- Implement Address CRUD UI (add/edit/delete, set default) matching backend addresses behavior.
- Implement Password change UI (if backend supports; otherwise add backend endpoint in a later step).
- Profile editing UI only if backend exposes a stable endpoint; otherwise mark as deferred.
**Testing:**
- Frontend integration tests: address create/edit/delete, set default.
- Manual: verify navigation visibility across roles.

### Step 8: Notifications UI completion (commit 8)
**Files:** `frontend/src/pages/**`, `frontend/src/features/notifications/**`, `frontend/src/api/**`
**What:**
- Implement “mark single notification read”.
- Add “Unread only” toggle OR an equivalent clear unread visual distinction (as per `REQUIREMENTS.md`).
**Testing:**
- Frontend integration tests: unread filter/toggle; single mark-read success/error.

### Step 9: Frontend UX + reliability + accessibility baselines (commit 9)
**Files:** `frontend/src/api/**`, `frontend/src/shared/**`, `frontend/src/pages/**`, `frontend/src/features/**`
**What:**
- Standardize empty/loading/error states across pages.
- Centralize auth-expiry handling (401 → logout/redirect) consistently across API calls.
- Guard against stale query params for checkout/cart selection with clear UX.
- Accessibility pass: labels, focus states, keyboard navigation, `aria-*` as needed.
- Type safety backlog: replace remaining broad `unknown` / `Record<string, unknown>` where feasible (target API models first).
**Testing:**
- Unit tests for API error parsing + 401 handling.
- Manual keyboard navigation pass for forms.

### Step 10: Admin portal docs + route/component documentation (commit 10)
**Files:** `frontend/src/admin/**`, `backend/apps/admin_api/docs_views.py`, `backend/apps/admin_api/docs_urls.py`, `backend/docs/*`
**What:**
- Implement the requirement: “Frontend: document frontend routes/components and surface them in the admin portal docs view.”
- Decide and document the mechanism (e.g., generated JSON at build time, or a curated markdown page committed under `backend/docs/`).
**Testing:**
- Manual: visit `/admin/docs` and confirm the routes/components documentation is visible to admins only.

### Step 11: Payments: implement a “free/low-cost” flow (COD + manual proof upload) (commit 11)
**Files:** `backend/apps/payments/**`, `backend/apps/orders/**`, `backend/media/**`, `backend/config/urls.py`, `frontend/src/features/checkout/**`, `frontend/src/features/payments/**`, `frontend/src/api/**`
**What:**
- Implement payment methods that do not require a paid gateway:
  - Cash on Delivery (COD): create a payment record with method=COD and status=pending/authorized per your model.
  - Manual transfer proof: add a form that allows users to submit a payment “proof” (screenshot upload) tied to an order/payment; status stays “pending_review” until admin approval.
- Ensure order status transitions reflect payment status (pending/paid/failed/refunded where relevant).
- Admin can review/approve/reject manual proof payments (via Django admin and/or admin portal).
**Testing:**
- Backend integration tests: create payment for order (ownership), upload proof, invalid file, invalid order state.
- Frontend integration tests: submit proof form error/success.

### Step 12: Backend admin RBAC expectations (commit 12)
**Files:** `backend/apps/accounts/**`, `backend/apps/admin_api/**`, `backend/utils/permissions.py`, Django admin configuration under `backend/apps/**/admin.py`
**What:**
- Use Django’s built-in Groups/Permissions as the source of truth for “admin can grant/revoke access” to admin features.
- Expose/manage these permissions in the custom admin portal (if not already), so a super-admin can grant other users access to specific admin features.
- Ensure the custom admin APIs enforce object-level and action-level permissions.
**Testing:**
- Backend integration tests: admin endpoints allow/deny based on group/permission membership.
- Manual: super-admin grants a permission; the delegated admin can access only allowed admin routes.

### Step 13: Backend test coverage backlog (commit 13)
**Files:** `backend/apps/orders/tests*`, `backend/apps/cart/tests*`, `backend/apps/payments/tests*`, `backend/utils/test_*`
**What:**
- Add API tests for orders: `create_from_cart` with `item_ids`, empty selection, invalid IDs, cart quantity behavior.
- Add API tests for payments: create_for_order ownership, invalid method, cancelled order.
- Add unit tests for utilities: money validation, idempotency helpers, telemetry/logging helpers.
- Add E2E-style HTTP tests for critical user journey if existing test infrastructure supports it; otherwise document how to run it.
**Testing:**
- Run backend test suite locally.

### Step 14: OpenTelemetry — Admin Portal backend instrumentation (commit 14)
**Files:** `backend/apps/admin_api/**`, `backend/utils/tracing.py`, `backend/utils/telemetry.py`, `backend/utils/otel_utils.py`
**What:**
- Implement all unchecked “OpenTelemetry (Admin Portal - Backend)” items from `REQUIREMENTS.md`:
  - Dedicated tracing for admin CRUD endpoints, permission checks, bulk operations.
  - Span attributes (admin_user_id, permission_name, model_name, action_type, affected_count, error categories).
  - Metrics for admin operations and session activity.
- Keep payload sensitivity in mind: do not log PII; only identifiers and counts.
**Testing:**
- Integration tests assert tracing hooks do not break endpoints.
- Manual: run with collector and verify spans/metrics appear.

### Step 15: OpenTelemetry — Admin Portal frontend instrumentation (commit 15)
**Files:** `frontend/src/admin/**`, `frontend/src/api/**`, `frontend/src/shared/**`
**What:**
- Implement all unchecked “OpenTelemetry (Admin Portal - Frontend)” items from `REQUIREMENTS.md`:
  - Navigation spans, form submission spans, bulk action spans, search/filter spans.
  - Performance marks and metrics.
  - Context attributes (admin_user_id, model, view, selected_items).
**Testing:**
- Manual: confirm admin actions generate spans and include expected attributes.

### Step 16: OpenTelemetry — Frontend full instrumentation (commit 16)
**Files:** `frontend/src/**`, `frontend/vite.config.ts`
**What:**
- Implement all unchecked “OpenTelemetry (Frontend)” items from `REQUIREMENTS.md`:
  - Web SDK setup, fetch/XHR instrumentation, route transition context propagation.
  - Custom spans for key user journeys and Web Vitals metrics.
  - Sampling + session tracking.
**Testing:**
- Manual: run locally with collector and verify end-to-end trace correlation (browser → backend).

### Step 17: Frontend testing levels (unit/integration/e2e) (commit 17)
**Files:** `frontend/src/test/**`, `frontend/package.json`, `frontend/vitest.config.*` (if present)
**What:**
- Add unit tests for key utilities/components.
- Add page-level integration tests with mocked API for critical flows.
- Add E2E tests (Playwright/Cypress) for:
  - login → browse → add to cart → checkout → order confirmation
  - admin: CRUD + docs
**Testing:**
- Run `npm test` (unit/integration) and `npm run e2e` (if configured).

### Step 18: Final docs + polish (commit 18)
**Files:** `REQUIREMENTS.md`, `Readme.md`, `backend/docs/*`, `frontend/README.md`
**What:**
- Mark completed items, remove “coming soon” drift.
- Add/refresh “how to run” instructions for backend + frontend + collector.
- Add/refresh webhook plan section (still required by `REQUIREMENTS.md`), even if webhooks are not implemented.
**Testing:**
- Manual: follow docs from scratch; ensure steps are reproducible.

## Open Questions / [NEEDS CLARIFICATION]
- Payment proof upload:
  - What max file size and allowed formats (png/jpg/pdf)?
  - Should proof images be visible to the customer after upload?
- Manual proof review flow:
  - Who can approve/reject (super-admin only or any user with permission)?
  - Should approval trigger an order status transition (e.g., `paid`)?
- Admin “access to telemetry”:
  - Do you want the admin portal to *display* traces/metrics (UI integration), or is “access” satisfied by admin-only docs/links to Jaeger/Zipkin UIs?
- “Webhook plan” requirement:
  - Are webhooks in scope to implement now, or only to document?

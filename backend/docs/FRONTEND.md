# Frontend Overview

This document describes the frontend app structure, key routes, and API modules for the admin docs viewer.

## Routes (SPA)
- `/` — Home / landing page (featured products, hero)
- `/products` — Product listing (search, filters, pagination)
- `/products/:slug` — Product detail
- `/cart` — Cart
- `/checkout` — Checkout flow
- `/account` — Account pages (settings, addresses)
- `/orders/:id` — Order detail
- `/admin/docs` — Admin docs viewer

These routes are defined in `frontend/src/app/AppRouter.tsx` (single page AppRouter).

## Key API modules
- `frontend/src/api/http.ts` — low-level fetch wrapper used across the app
- `frontend/src/api/products.ts` — product/category/brand list and product detail helpers
- `frontend/src/api/cart.ts` — cart manipulation helpers
- `frontend/src/api/accounts.ts` — account-related API helpers
- `frontend/src/api/payments.ts` — payments listing / uploads

## Major pages
- `frontend/src/pages/HomePage.tsx` — Landing and featured products
- `frontend/src/pages/ProductsPage.tsx` — Browse/search results
- `frontend/src/pages/ProductDetailPage.tsx` — Product detail and variants
- `frontend/src/pages/OrderDetailPage.tsx` — Order details + payments

## Notes
- The frontend ships a lightweight OpenTelemetry setup under `frontend/src/telemetry` (if present).
- API base URL is configured via `import.meta.env.VITE_API_BASE_URL`.

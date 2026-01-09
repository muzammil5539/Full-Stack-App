---
applyTo: '**/*.py'
---
## Project context

This repo is a Django REST Framework (DRF) e-commerce backend with multiple Django apps under `backend/apps/` (accounts, products, cart, orders, payments, reviews, wishlist, notifications). The API is mounted under `/api/v1/...` in `backend/config/urls.py`.

Key backend traits to preserve:
- DRF ViewSets + serializers are the primary API shape.
- Auth is token-based (`TokenAuthentication`) with some session auth enabled.
- Rate limiting is configured via DRF throttles (scopes like `checkout`, `payment`, `auth`).
- Money values are handled as `Decimal` and validated via `utils.decimal_utils` helpers.
- Observability is present (OpenTelemetry spans + metrics + baggage middleware). OTEL is environment-controlled via `OTEL_ENABLED`.
- Tests are present (pytest/pytest-django as well as app-level tests). Keep tests deterministic.

## Coding guidelines for generating code

### API and business logic
- Prefer DRF `ViewSet`/`ModelViewSet` patterns (actions via `@action`) to keep routing consistent.
- Keep serializers responsible for input validation/shape; keep view methods responsible for orchestration (transactions, permissions, calling domain helpers).
- Use consistent error responses:
	- For validation-like errors: `{'error': <short string>, 'details': <field->list mapping>}`.
	- For simple errors: `{'error': <short string>}`.
- For money fields:
	- Parse into `Decimal` (never float) and validate with `utils.decimal_utils.validate_money_field`.
	- Round currency with `utils.decimal_utils.round_currency` when emitting totals.
- For inventory/stock changes, enforce correctness inside `transaction.atomic()` and lock rows as needed (`select_for_update()`), matching existing order checkout patterns.
- If an endpoint needs idempotency, use the existing idempotency key pattern (header `Idempotency-Key` and `Order.idempotency_key` behavior as reference).

### Observability (OpenTelemetry)
- Treat OTEL as optional: any span/metric emission should never break the API. Follow existing patterns that wrap metric calls in `try/except`.
- Use `utils.otel_utils` helpers (e.g., `set_span_attributes`, `add_span_event`, `record_span_error`) instead of open-coding where possible.
- When adding new endpoints for critical flows (checkout/payment), add span attributes/events that help correlate user/order/payment IDs.

### Django conventions
- Do not change `settings/*` behavior casually; prefer configuration via environment variables.
- When modifying models:
	- Create migrations.
	- Update admin registration if needed.
	- Update serializers and tests.
- Prefer `select_related`/`prefetch_related` in querysets for endpoints returning nested data.

### Async/background work (Celery/Redis)
- The repo declares `celery` and `redis` dependencies; if you introduce background processing, implement it with Celery tasks (avoid ad-hoc threads).
- Tasks must be idempotent and retry-safe, and should never assume an OTEL collector is reachable.

### Database
- Keep DB interactions compatible with SQLite for local/testing.
- If adding Postgres-specific behavior, gate it or document it clearly.

### Style and maintainability
- Use type hints for new helpers/utilities and non-trivial functions.
- Keep functions small and single-purpose; extract helpers when view logic becomes large.
- Avoid broad exception catches unless you re-raise; when returning user-facing errors, keep messages concise and stable.

### Testing
- Add/extend tests next to the app being changed (existing pattern: `apps/<app>/test_*.py`).
- Use pytest-django patterns/fixtures if the surrounding tests do.
- Ensure tests don’t require an external OTEL collector; OTEL export failures should not fail tests.

## Coding guidelines for answering questions

- When proposing backend changes, always name:
	- the endpoint path(s) under `/api/v1/...`,
	- the expected request/response shape,
	- and the impact on permissions and throttling.
- If behavior depends on environment (OTEL, email backend, DB), call it out and propose a safe default.

## Coding guidelines for reviewing changes

- Verify: permission classes, queryset scoping (user vs admin), and that object-level access is enforced where relevant.
- Verify: transaction boundaries for stock/payment/order creation.
- Verify: money fields use `Decimal` end-to-end (no floats).
- Verify: API errors remain consistent (error + details).
- Verify: telemetry code cannot raise and break the request.
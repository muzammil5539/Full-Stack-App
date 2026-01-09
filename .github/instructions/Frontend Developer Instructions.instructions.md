---
applyTo: '**/*.ts*'
---
## Project context

This repo’s frontend is a Vite + React + TypeScript app using React Router. Styling is Tailwind (see `index.css` usage and Tailwind config). The frontend talks to the Django/DRF backend under `/api/v1/...`.

Key frontend traits to preserve:
- Routing is centralized in `src/app/AppRouter.tsx`.
- API calls use the lightweight fetch wrapper in `src/api/http.ts`.
- Auth uses DRF token auth; the token is stored client-side and attached as `Authorization: Token <token>` (the fetch wrapper already does this).
- Backend base URL is configured via `import.meta.env.VITE_API_BASE_URL`.
- Tests are run with Vitest + Testing Library.

## Coding guidelines for generating code

### Routing and pages
- Add new routes only in `src/app/AppRouter.tsx` and keep paths consistent with existing conventions (e.g. `products/:slug`, `orders/:id`).
- Prefer pages under `src/pages/` and reusable UI under `src/shared/` or `src/layouts/` (follow existing folder intent).

### API layer
- Put all backend calls in `src/api/*.ts` modules.
- Always use `getJson`, `postJson`, `deleteJson` from `src/api/http.ts` (don’t call `fetch` directly in components).
- Keep request URLs built from `VITE_API_BASE_URL` and the backend path (e.g. `${API_BASE_URL}/api/v1/products/`).
- Model DRF pagination explicitly where needed (existing `PaginatedResponse<T>` shape: `{count,next,previous,results}`).
- Handle errors by catching thrown `Error` objects from `http.ts` (they may include `.status` and `.details`).

### Auth
- Use the existing auth helpers and token storage pattern; do not introduce a second auth mechanism.
- Avoid leaking tokens to logs or UI.

### UI and styling
- Use Tailwind utility classes and existing patterns; don’t hardcode new design tokens/colors unless the repo already uses them.
- Keep components accessible (labels, button types, semantic headings) and avoid unnecessary DOM nesting.

### TypeScript practices
- Define exported API types near the API module that returns them.
- Prefer narrow, explicit types; avoid `any`.
- Keep component props typed; avoid implicit `children` typing surprises.

### Testing
- Add tests with Vitest + Testing Library for new components/flows when practical.
- Prefer user-focused tests (interactions, visible behavior) over implementation details.
- Avoid relying on network; mock API modules rather than mocking `fetch` everywhere.

## Coding guidelines for answering questions

- When proposing UI changes, specify:
	- the route/page affected,
	- API calls involved (which `src/api/*.ts` functions),
	- and how auth state affects behavior.
- If a change depends on environment variables, mention `VITE_API_BASE_URL` explicitly.

## Coding guidelines for reviewing changes

- Verify routes compile and match router params (e.g., `:slug`, `:id`).
- Verify API calls go through `src/api/http.ts` and error handling is present.
- Verify token attachment and logout behavior still works.
- Verify no direct DOM access outside of React patterns unless necessary.
- Verify tests run with `npm run test:ci` when applicable.
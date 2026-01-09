# Admin Docs (frontend additions)

This folder contains small frontend-generated documentation items that are surfaced in the Admin / Docs UI alongside backend docs served from `/docs/`.

- `frontendDocs.ts` provides a couple of static documents (`frontend:routes`, `frontend:components`) to help admins understand the frontend routing and major components.
- `README.md` (this file) explains the purpose and how to extend the frontend docs.

How to extend:

1. Add a new entry to `frontendDocs` in `frontendDocs.ts` and implement `getFrontendDoc(name)` to return a `{ name, title, content_type, content }` object.
2. The admin docs UI (`AdminDocsPage.tsx`) will automatically include frontend docs after backend docs.

Notes:
- Documents are plain markdown stored in code for now — they can be replaced with automated extraction (TSDoc, component prop parsing) in a later step.
- Keep frontend docs short and high-level to avoid maintaining large docs in code.

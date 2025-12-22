# Copilot Instructions for Brancr (concise)

Welcome! This file contains short, task-focused guidance for AI coding agents working on Brancr.

## Quick start
- Dev: `npm install && npm run dev` (Next.js Dev on :3000)
- Build: `npm run build`
- Tests: `npm test` (Jest), coverage: `npm test:coverage`
- Lint: `npm run lint`

## Big picture
- Next.js 14 App Router, TypeScript, Tailwind.
- Multi-tenant app: all tenant UI under `app/(tenant)/`. Tenant context is provided by `app/(tenant)/app/layout.tsx` and must be respected for tenant-scoped behavior.

## Important patterns (do these in this codebase)
- Tenant access: always validate using `lib/tenant-validation.ts` before any tenant-sensitive API or data access.
- API client: `lib/api.ts` is the single HTTP client. Include tenant id in path or headers and follow its retry rules: no retries for 4xx, up to 3 retries for 5xx.
- Error -> user message: use `lib/error-messages.ts` and `getUserFriendlyErrorMessage(error, { platform })` for UI-facing errors.
- Observability: use `lib/observability.ts` to `captureException` and send events to `/api/observability`; enabled by `NEXT_PUBLIC_ENABLE_OBSERVABILITY`.
- Validation: Zod schemas live in `lib/validation.ts`; use `validateWithErrors()` to return error arrays for forms.
- React Query config: defined in `app/providers.tsx` (30s staleTime, no refetchOnFocus, 3x retry for 5xx only). Follow that behavior for data fetching and mutations.

## File & Folder Conventions
- Public-facing components: `app/components/` (shared)
- Tenant-only components: `app/(tenant)/components/`
- API routes: `app/api/<area>/route.ts` (example: `app/api/waitlist/route.ts`)
- Tests mirror structure under `__tests__/` (example: `__tests__/lib/validation.test.ts`)

## Integrations & infra notes (explicit examples)
- Optional Redis-backed parsing: `lib/parse-jobs.ts` uses `REDIS_URL` when present; `scripts/parse-worker.js` consumes `parse:queue` (start: `REDIS_URL=redis://... node scripts/parse-worker.js`).
- Waitlist storage: `lib/waitlistStorage.ts` writes to `data/waitlist.json` by default; supports `WAITLIST_STORAGE_DIR` and Vercel temp fallbacks. Use `saveWaitlistEntry` / `getWaitlistEntries` helpers.
- Websocket helpers: `lib/websocket.ts` and hooks `hooks/use-websocket.ts` / `hooks/use-websocket-tenant.ts`.
- Observability: `lib/observability.ts` (self-hosted); enable with `NEXT_PUBLIC_ENABLE_OBSERVABILITY=true` and override endpoint with `NEXT_PUBLIC_OBSERVABILITY_ENDPOINT`.

## Dev & testing tips
- Jest config: `jest.config.js`, setup in `jest.setup.js`. Tests live in `__tests__/` and mirror source layout.
- Testing tenant components: mock or wrap `TenantProvider` (see `__tests__/payments/PaymentsPage.test.tsx`) and use `QueryClientProvider` wrappers (look for `renderWithProviders` helpers in tests).
- Parse jobs: without `REDIS_URL` jobs run in-memory (local simulation); to test Redis mode run the parse worker and a Redis instance.

## Styling & conventions
- Tailwind theme in `tailwind.config.ts` (tokens: primary `#1B1A55`, accent `#635BFF`).
- File naming: pages = `page.tsx`, layouts = `layout.tsx`, components = PascalCase, utilities = camelCase.

## Quick examples
- Parse worker: `REDIS_URL=redis://localhost:6379 node scripts/parse-worker.js`
- Observability: `captureException(new Error('x'), { tenant_id, action: 'publish' })`
- Test mocking tenant provider (example):
```ts
jest.mock('@/app/(tenant)/providers/TenantProvider', () => ({
  TenantProvider: ({ children }: any) => <div>{children}</div>
}));
```

## When to ask a human
- Architectural changes to multi-tenant routing, security-sensitive logic, or observability pipeline.
- Anything that requires credentials, secret material, or external infra provisioning (DB, Supabase/Airtable, Vercel secrets).

## Helpful Examples (copy-ready)
- Error handling in UI:
```ts
try { await sendMessage(); } catch (err) { toast.error(getUserFriendlyErrorMessage(err, { platform: 'instagram' })); }
```
- Capture errors:
```ts
captureException(error, { tenant_id, action: 'publish' });
```

## When to ask a human
- Architectural changes to multi-tenant routing, security-sensitive logic, or observability pipeline.
- Anything that requires credentials, secret material, or external infra provisioning (DB, Supabase/Airtable, Vercel secrets).

---
If anything here is unclear or you're missing a pattern to automate, tell me which area to expand and I'll iterate. ✅

> Want more details? Ask for an expanded section (examples, PR checklist, or a focused walkthrough of any area).

---


---
Feedback welcome: If any section is unclear or missing, please specify for improvement.

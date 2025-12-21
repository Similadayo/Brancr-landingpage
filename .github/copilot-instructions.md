# Copilot Instructions for Brancr Landing Page

Welcome — this file contains focused, codebase-specific guidance for AI coding agents working on Brancr.

## Quick Start
- Dev: `npm install && npm run dev` (Next.js App Router on :3000)
- Build: `npm run build`
- Tests: `npm test` (Jest), coverage: `npm test:coverage`
- Lint: `npm run lint`

## Big Picture
- Next.js 14 App Router with TypeScript and TailwindCSS. Root pages are `page.tsx`, layouts are `layout.tsx`.
- Multi-tenant app lives under `app/(tenant)/` — tenant layouts provide tenant context and scope tenant UI and API usage.

## Key Patterns & Conventions
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

## Integrations & External Points
- Waitlist: see `app/api/waitlist/route.ts` (placeholder; replace with Supabase or Airtable client if integrating DB).
- Websocket helpers: `lib/websocket.ts` and hooks `hooks/use-websocket.ts` / `hooks/use-websocket-tenant.ts` for real-time features.

## Testing & Debugging Notes
- Jest setup is in `jest.setup.js`; tests live in `__tests__/` and follow the source layout.
- For testing components that rely on tenant context, wrap them with the tenant provider from `app/(tenant)/app/layout.tsx` or use the helpers in `__tests__/`.

## Styling & Design System
- Tailwind config is `tailwind.config.ts`. Primary colors and theme are centralized there — follow these tokens for consistent UI.

## Observability & Non-Sentry Policy
- This project uses `lib/observability.ts` (self-hosted endpoint). **Do not** add Sentry; send events via existing observability helpers.

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

# Brancr Copilot Instructions

## Project Overview
Brancr is a Next.js 14 multi-tenant SaaS platform for AI-powered marketing, targeting African SMEs. The codebase combines:
- **Public landing page** (`app/`, root routes) with waitlist capture
- **Tenant portal** (`app/(tenant)/`) for authenticated dashboards, campaign management, and integrations
- **Custom API client** with tenant isolation and robust error handling
- **Self-hosted observability** (no Sentry)

## Architecture & Patterns

### Multi-Tenant Structure
- All tenant routes are under `app/(tenant)/app/` and inherit tenant context from their layout.
- Always validate tenant access using `lib/tenant-validation.ts` before API/data access.
- Example: `app/(tenant)/app/analytics/page.tsx` uses tenant context automatically.

### API Client & Error Handling
- Use `lib/api.ts` for all HTTP calls. Always include tenant ID in path or headers.
- 4xx errors: do not retry; 5xx: retry up to 3x (see `api.ts`).
- Use `getUserFriendlyErrorMessage()` from `lib/error-messages.ts` for all user-facing errors. Pass context (platform, alert_type) for platform-specific messages.
- Example:
  ```typescript
  try {
    await sendMessage();
  } catch (error) {
    toast.error(getUserFriendlyErrorMessage(error, { platform: 'instagram' }));
  }
  ```

### Validation & Forms
- Zod schemas in `lib/validation.ts` (e.g., `signupSchema`, `conversationReplySchema`).
- Use `validateWithErrors()` for error arrays; sanitize all user input.
- Example:
  ```typescript
  const result = validateWithErrors(signupSchema, formData);
  if (!result.success) setErrors(result.errors);
  ```

### Observability
- Use `lib/observability.ts` for error/event tracking. No Sentry; send to `/api/observability`.
- Enable with `NEXT_PUBLIC_ENABLE_OBSERVABILITY` env var.
- Example:
  ```typescript
  captureException(error, { tenant_id, action: 'publish' });
  ```

### Data Fetching
- React Query config in `app/providers.tsx`: 30s staleTime, no refetch on focus, 3x retry on 5xx only.
- Mutations: do not retry by default.

## Conventions & Workflows

- **Component structure**: `app/components/` (public), `app/(tenant)/components/` (tenant)
- **File naming**: Pages = `page.tsx`, Layouts = `layout.tsx`, Utilities = camelCase, Components = PascalCase
- **Styling**: TailwindCSS with custom theme (primary `#1B1A55`, accent `#635BFF`)
- **Testing**: Jest + Testing Library, tests in `__tests__/` mirroring source
- **Build/test**: `npm run dev`, `npm run build`, `npm run lint`, `npm test`, `npm test:coverage`

## Key Files

| File | Purpose |
|------|---------|
| `lib/api.ts` | API client, error/retry logic |
| `lib/error-messages.ts` | User error mapping |
| `lib/validation.ts` | Zod schemas, sanitization |
| `lib/tenant-validation.ts` | Tenant access checks |
| `lib/observability.ts` | Error/event tracking |
| `app/providers.tsx` | React Query config |
| `app/(tenant)/app/layout.tsx` | Tenant context provider |
| `jest.config.js` | Test setup |
| `tailwind.config.ts` | Theme/colors |

## AI Agent Guidance

- Always validate tenant access before API/data calls
- Use user-friendly error messages; avoid technical jargon
- Use custom observability, not Sentry
- Prefer platform-specific error context (WhatsApp, Instagram, TikTok)
- Follow test and component structure conventions

---
Feedback welcome: If any section is unclear or missing, please specify for improvement.

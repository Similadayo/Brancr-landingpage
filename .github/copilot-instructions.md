
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

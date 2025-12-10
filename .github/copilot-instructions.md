# Brancr Copilot Instructions

## Project Overview
Brancr is a **Next.js 14 landing page + multi-tenant SaaS platform** for an AI-powered marketing assistant targeting African SMEs. The codebase combines:
- **Public landing page** (`app/`, root routes) with waitlist capture
- **Authenticated tenant portal** (`app/(tenant)/`) with dashboard, integrations, and campaign management
- **Custom API wrapper** with error handling and tenant isolation
- **Self-hosted observability** (custom error tracking, no Sentry)

## Architecture Patterns

### 1. Multi-Tenant Layout Structure
```
app/(tenant)/
├── app/              # Tenant-specific dashboard routes
│   ├── layout.tsx    # Tenant context provider
│   └── [feature]/    # Feature pages (campaigns, analytics, etc.)
├── components/       # Tenant-scoped components
└── hooks/           # Tenant-specific hooks
```
**Key pattern**: Routes under `(tenant)` group inherit tenant context. Always validate `tenantId` matches the session—see `lib/tenant-validation.ts`.

### 2. API Client Architecture
- **Base client**: `lib/api.ts` with `apiFetch()`, `get()`, `post()` helpers
- **Status codes**:
  - `4xx`: Don't retry (e.g., validation errors, 403 access denied)
  - `5xx`: Retry up to 3 times with exponential backoff
  - `429`: Rate limit—user-friendly message suggests wait
- **Tenant isolation**: Always include tenant ID in path or headers; `validateTenantAccess()` prevents data leaks
- **Example**:
  ```typescript
  import { tenantApi } from '@/lib/api';
  const response = await tenantApi.get(`/tenant/${tenantId}/campaigns`);
  ```

### 3. Error Handling & User Messaging
- **Raw API errors** → `getUserFriendlyErrorMessage()` → user toast
- **Context-aware messages**: Use `ErrorContext` (action, resource, platform, alert_type) for precise feedback
- **Platform-specific**: Detect WhatsApp template failures, Instagram rate limits, TikTok upload failures
- **Location**: `lib/error-messages.ts` with `ErrorMessages` constants for onboarding, media, conversations, campaigns, integrations
- **Example**:
  ```typescript
  try {
    await sendMessage();
  } catch (error) {
    const msg = getUserFriendlyErrorMessage(error, { platform: 'instagram' });
    toast.error(msg);
  }
  ```

### 4. Input Validation (Zod)
- **Schemas** in `lib/validation.ts`: `emailSchema`, `passwordSchema`, `loginSchema`, `signupSchema`, `conversationReplySchema`
- **Sanitization**: `sanitizeString()` (trim, XSS), `sanitizeHtml()`, `sanitizeNumber()`
- **Use `validateWithErrors()`** for formatted error arrays:
  ```typescript
  const result = validateWithErrors(signupSchema, formData);
  if (!result.success) {
    setErrors(result.errors); // ['email: Invalid email address', ...]
  }
  ```

### 5. Observability (Custom, Not Sentry)
- **Module**: `lib/observability.ts` with Sentry-compatible API
- **Client-side tracking**: Automatic unhandled error/rejection capture
- **Server-side**: Send to `/api/observability` endpoint
- **Usage**: `captureException()`, `captureMessage()`, `setUserContext()`, `trackEvent()`
- **Env**: `NEXT_PUBLIC_OBSERVABILITY_ENDPOINT` (default `/api/observability`), `NEXT_PUBLIC_ENABLE_OBSERVABILITY` (default false, enable in prod)

### 6. Data Fetching with React Query
- **Config** in `app/providers.tsx`: staleTime 30s, no refetch on window focus
- **Retry logic**: Skip on 4xx (client errors), retry 3x on 5xx with exponential backoff
- **Mutations**: Don't retry by default
- **Pattern**: Combine TanStack Query mutations with error handling:
  ```typescript
  const mutation = useMutation({
    mutationFn: (data) => tenantApi.post(`/tenant/${tenantId}/posts`, data),
    onError: (error) => {
      toast.error(getUserFriendlyErrorMessage(error));
    },
  });
  ```

## Key Conventions

### Component Organization
- **Landing page components**: `app/components/` (Header, Hero, Features, CTA, etc.)
- **Tenant components**: `app/(tenant)/components/` grouped by feature (onboarding/, posting/, etc.)
- **Shared icons**: `app/(tenant)/components/icons` (reusable SVG set)
- **Form pattern**: Separate validation logic, error state, submission handler

### File Naming
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- Reusable: PascalCase (e.g., `WhatsAppNumberSelector.tsx`)
- Utilities: camelCase (e.g., `rate-limiter.ts`, `tenant-validation.ts`)
- Tests: `__tests__/` directory matching source structure

### TypeScript & Validation
- Use `const` variables for step/route constants to avoid typos:
  ```typescript
  type Step = 'upload' | 'strategy' | 'captions' | 'platforms' | 'schedule';
  const STEPS: Step[] = [...];
  const STEP_LABELS: Record<Step, string> = {...};
  ```
- Validate responses with `validateTenantInResponse()` for multi-tenant safety
- Use `stripTenantContext()` before logging sensitive data

### Styling
- **System**: TailwindCSS with custom theme (primary `#1B1A55`, accent `#635BFF`)
- **Animations**: Framer Motion for entrance/hover effects
- **Responsive**: Mobile-first, tested with Jest + Testing Library
- **Error UI**: Red banners (bg-red-50, border-red-200, text-red-900)

## Development Workflow

### Common Commands
```bash
npm run dev          # Next.js dev server on :3000
npm run build        # Production build (checks errors, optimizes)
npm run lint         # ESLint + Next.js rules
npm test             # Jest (unit + integration)
npm test:watch       # Watch mode for TDD
npm test:coverage    # Coverage report
```

### Testing Strategy
- **Location**: `__tests__/` (mirrors source structure)
- **Types**: Accessibility, error handling, media, mobile, onboarding
- **Setup**: Jest with jsdom, @testing-library/react, Coverage from app/** + lib/**
- **Example**:
  ```typescript
  import { render, screen } from '@testing-library/react';
  import { queryClient } from '@/app/providers';
  
  test('shows error message on API failure', () => {
    // Mock tenantApi.post to throw
    // Render component, assert error toast
  });
  ```

### Debugging
- **Client errors**: Check browser DevTools, inspect `observability` payload
- **API failures**: Verify tenant ID in request, check API logs, confirm 4xx vs 5xx
- **Styling**: Use TailwindCSS IntelliSense, check responsive breakpoints
- **React Query**: Use browser DevTools extension to inspect query cache

## Common Tasks

### Adding a New Tenant Feature Page
1. Create `app/(tenant)/app/[feature]/page.tsx` (automatically has tenant context)
2. Import `tenantApi` and validate tenant ID:
   ```typescript
   import { tenantApi } from '@/lib/api';
   export default async function FeaturePage() {
     const tenantId = getTenantIdFromSession();
     const data = await tenantApi.get(`/tenant/${tenantId}/feature`);
   }
   ```
3. Add error boundary in parent `layout.tsx`
4. Test with `__tests__/` parallel structure

### Handling Platform Errors
1. Catch error in try/catch, pass `context` with `platform` and `alert_type`
2. `getUserFriendlyErrorMessage()` checks `alert_type` against known patterns
3. Example for WhatsApp:
   ```typescript
   catch (error) {
     const msg = getUserFriendlyErrorMessage(error, { 
       platform: 'whatsapp',
       alert_type: 'whatsapp_template_failure' 
     });
   }
   ```

### Adding Form Validation
1. Define Zod schema in `lib/validation.ts` (with `sanitizeString` transforms)
2. Use `validateWithErrors()` for error arrays or `validate()` for raw ZodError
3. Map field-level errors in form state
4. Show errors above fields, toast on submit failure

### Observability: Capturing Errors
```typescript
import { captureException } from '@/lib/observability';

try {
  await risky();
} catch (error) {
  captureException(error, { tenant_id: 123, action: 'campaign_publish' });
  toast.error('Failed to publish—please try again.');
}
```

## Important Files Reference
| File | Purpose |
|------|---------|
| `lib/api.ts` | HTTP client with ApiError class, retry logic |
| `lib/error-messages.ts` | User-friendly error mapping, ErrorMessages constants |
| `lib/validation.ts` | Zod schemas, sanitization helpers |
| `lib/tenant-validation.ts` | Multi-tenant access checks |
| `lib/observability.ts` | Error tracking (custom, Sentry-compatible) |
| `app/providers.tsx` | React Query + Toaster config |
| `app/layout.tsx` | Root layout, metadata, error boundary |
| `app/(tenant)/app/layout.tsx` | Tenant session provider |
| `jest.config.js` | Test setup, coverage paths |
| `tailwind.config.ts` | Custom colors (primary, accent, neutral) |

## Notes for AI Agents
- **Always validate tenant access** before API calls in multi-tenant routes
- **Error messages must be user-friendly**—avoid technical jargon, suggest actions
- **Tests are required** for new features; use existing test patterns
- **No Sentry**—use the custom `observability` module
- **Check for platform-specific errors**—WhatsApp templates, Instagram rate limits, TikTok uploads
- **Framer Motion** for animations, but keep performance-conscious (prefers GPUs)
- **React Query retry logic**: Don't retry 4xx, do retry 5xx—already configured in providers

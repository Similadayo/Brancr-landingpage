# Order Details — Frontend Mapping & Debugging

This document lists the exact backend endpoints, response fields, and recommended debugging steps when working on the Order Details UI.

## Backend endpoints
- GET `/api/tenant/orders/{id}` — returns full order object (tenant-auth required). See `getOrder` in `order_handlers.go`.
- PUT `/api/tenant/orders/{id}` — update order (status, notes). See `updateOrder` in `lib/api.ts`.
- PUT `/api/tenant/orders/{id}/confirm-payment` — confirm payment; use `confirmOrderPayment` helper.
- GET `/api/tenant/orders/{orderId}/portal-token` — generate portal token and `portal_url` (tenant-auth). See `generatePortalToken` in `customer_portal_handlers.go` and `GeneratePortalTokenAndURL` in `service.go`.
- Public: GET `/api/portal/order?token={token}` and GET `/api/portal/receipt?token={token}` — used by customer-facing portal page.

## Important response fields (map exactly)
- `order.payment_reference` (string)
- `order.status` (string) — values: `pending|confirmed|processing|completed|cancelled`
- `order.platform` (string)
- `order.created_at` (ISO string) — use `order.created_at` and guard for null
- `order.customer_name`, `order.customer_email`, `order.customer_phone`
- `order.items`: Array<{ name, quantity, unit_price, total_price }>
- `order.total_amount`, `order.currency`
- Portal token response: `{ portal_url, portal_token, expires_at }` — use `portal_url` directly

## Frontend guidelines
- Use `tenantApi.order(orderId)` / `tenantApi.generatePortalToken(orderId)` helpers (they call the tenant endpoints and include credentials).
- Always display a fallback (`N/A`) for missing fields.
- Format dates with `date-fns` (see `lib/date.ts`) and guard against null: `formatDate(order.created_at)`.
- Do NOT construct portal URL client-side from order number — use `portal_url` returned by the portal-token API.

## Debugging steps
1. Use `curl` with cookie to verify server response:
```bash
curl -i --cookie "<session_cookie>" http://localhost:8080/api/tenant/orders/11
```
Check the `order.created_at` field is present and ISO-formatted.

2. Check portal token generation:
```bash
curl -i --cookie "<session_cookie>" http://localhost:8080/api/tenant/orders/11/portal-token
```
Ensure response contains `portal_url` (should include `/api/portal/order?token=`).

3. End-to-end: open `portal_url` in browser; verify order/receipt display.

4. If the customer-facing page shows `Invalid Date`, inspect the returned field name (`created_at`) and confirm code is using that property.

## Files to inspect
- `app/(tenant)/app/orders/[id]/page.tsx` (admin order detail)
- `app/(tenant)/components/PortalLinkGenerator.tsx` (generates portal token)
- `app/portal/order/page.tsx` (public portal page)
- `lib/api.ts` (tenantApi helpers)

If you want, I can open a PR that: 1) removes the constructed portal link from `app/portal/order/page.tsx`, 2) adds the docs above, and 3) adds a unit test to assert `formatDate` behavior.

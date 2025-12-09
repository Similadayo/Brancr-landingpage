/**
 * Tenant isolation validation on the frontend
 */

import { ApiError } from './api-enhanced';

/**
 * Validate that a tenant ID matches the current session
 * This is a client-side check - the backend must also validate
 */
export function validateTenantAccess(
  requestedTenantId: number | string | undefined,
  currentTenantId: number | undefined
): void {
  if (!currentTenantId) {
    throw new ApiError('No tenant session found', 401, null);
  }

  if (requestedTenantId && Number(requestedTenantId) !== currentTenantId) {
    throw new ApiError('Access denied: Tenant ID mismatch', 403, {
      requested: requestedTenantId,
      current: currentTenantId,
    });
  }
}

/**
 * Validate tenant ID in API response
 */
export function validateTenantInResponse(
  response: { tenant_id?: number },
  currentTenantId: number
): void {
  if (response.tenant_id && response.tenant_id !== currentTenantId) {
    throw new ApiError('Response tenant ID mismatch', 403, {
      responseTenantId: response.tenant_id,
      currentTenantId,
    });
  }
}

/**
 * Extract tenant ID from path and validate
 */
export function validateTenantFromPath(
  path: string,
  currentTenantId: number
): void {
  // Check for tenant ID in path patterns like /api/tenant/...
  const tenantPathPattern = /\/tenant\/(\d+)/;
  const match = path.match(tenantPathPattern);
  
  if (match) {
    const pathTenantId = parseInt(match[1], 10);
    if (pathTenantId !== currentTenantId) {
      throw new ApiError('Path tenant ID mismatch', 403, {
        pathTenantId,
        currentTenantId,
      });
    }
  }
}


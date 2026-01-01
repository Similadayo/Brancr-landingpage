/**
 * UUID validation utility for frontend API calls.
 * All backend IDs are now UUIDs (strings), not integers.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID format.
 * @param id - The ID to validate
 * @returns true if valid UUID, false otherwise
 */
export function isValidUUID(id: string | undefined | null): id is string {
    if (!id || typeof id !== 'string') return false;
    return UUID_REGEX.test(id);
}

/**
 * Validates an ID for API calls. Returns the ID if valid, null otherwise.
 * Logs a warning for invalid IDs to help with debugging.
 * @param id - The ID to validate
 * @param context - Optional context for the warning message (e.g., "conversation", "order")
 * @returns The validated ID or null
 */
export function validateId(id: string | number | undefined | null, context?: string): string | null {
    // Handle number IDs (legacy) by converting to string
    const idStr = id !== undefined && id !== null ? String(id) : null;

    if (!idStr || idStr === 'undefined' || idStr === 'null' || idStr === 'NaN') {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Invalid ${context || 'ID'} provided:`, id);
        }
        return null;
    }

    // For now, accept both UUIDs and numeric strings (for transition period)
    // Once backend migration is complete, we can strictly enforce UUID format
    return idStr;
}

/**
 * Strictly validates UUID format. Use this when you're certain the ID should be a UUID.
 * @param id - The ID to validate
 * @param context - Optional context for the warning message
 * @returns The validated UUID or null
 */
export function validateUUID(id: string | undefined | null, context?: string): string | null {
    if (!isValidUUID(id)) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Invalid UUID format for ${context || 'ID'}:`, id);
        }
        return null;
    }
    return id;
}

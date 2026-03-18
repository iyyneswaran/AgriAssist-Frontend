/**
 * Centralized fetch wrapper that detects HTTP 429 (rate limit) responses
 * and dispatches a DOM event so the React layer can show a modal.
 *
 * Usage: drop-in replacement for `fetch()` in service files.
 */

export const RATE_LIMIT_EVENT = 'rate-limit-hit';

export async function apiFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const response = await fetch(input, init);

    if (response.status === 429) {
        // Fire a custom DOM event so RateLimitContext can pick it up
        window.dispatchEvent(new CustomEvent(RATE_LIMIT_EVENT));
    }

    return response;
}

const MAX_REQUESTS = 5;
const WINDOW_SECONDS = 3600;

interface RateLimitEntry {
  count: number;
  resetAt: number; // unix epoch seconds — when the current window expires
}

/**
 * Returns true if the request should be allowed, false if rate-limited.
 *
 * Rate limit: MAX_REQUESTS per IP per WINDOW_SECONDS rolling window.
 *
 * KV consistency trade-off
 * ------------------------
 * KV is eventually consistent. Two simultaneous first-requests from the
 * same IP can both read null and both proceed (race window at window
 * boundaries). For a free audit tool the blast radius is one extra free
 * audit, so this is an acceptable trade-off.
 *
 * If you need hard limits (e.g. paid quota), replace this with a
 * Durable Object: a single DO instance per IP gives atomic counter
 * updates at the cost of an additional billable class and a DO stub per
 * unique IP.
 */
export async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `rl:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const entry = await env.RATE_LIMIT.get<RateLimitEntry>(key, "json");

  if (entry !== null && now < entry.resetAt) {
    // Active window — check and increment
    if (entry.count >= MAX_REQUESTS) return false;
    await env.RATE_LIMIT.put(
      key,
      JSON.stringify({ count: entry.count + 1, resetAt: entry.resetAt }),
      // Preserve the original expiry — window does not reset on each request
      { expiration: entry.resetAt }
    );
  } else {
    // No entry or expired window — start a new one
    const resetAt = now + WINDOW_SECONDS;
    await env.RATE_LIMIT.put(key, JSON.stringify({ count: 1, resetAt }), {
      expiration: resetAt,
    });
  }

  return true;
}

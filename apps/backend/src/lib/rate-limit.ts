/**
 * In-memory fixed-window rate limiter (SPEC §30). Process-local — correct
 * for a single Node instance, but resets on redeploy and doesn't share
 * state across horizontally-scaled instances. Swap for a shared store
 * (Supabase table or Redis/Upstash) before running more than one instance
 * in production; the call sites below don't need to change.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function getClientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return value.split(",")[0].trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (realIp) return Array.isArray(realIp) ? realIp[0] : realIp;
  return req.ip ?? "unknown";
}

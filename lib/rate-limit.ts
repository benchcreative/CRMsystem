// In-memory sliding-window limiter. Fine for this app: it runs as a single
// Node process (deploy-per-client), so there's no shared store to sync.
// Counts reset on server restart.

const hitsByKey = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const recent = (hitsByKey.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= limit) {
    hitsByKey.set(key, recent);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((recent[0] + windowMs - now) / 1000),
    };
  }

  recent.push(now);
  hitsByKey.set(key, recent);

  // Keep the map from growing without bound across many one-off IPs.
  if (hitsByKey.size > 1000) {
    for (const [k, times] of hitsByKey) {
      if (times.every((t) => t <= windowStart)) hitsByKey.delete(k);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

// First X-Forwarded-For hop when behind a proxy; falls back to one shared
// "unknown" bucket (i.e. a global limit) if no IP header is present.
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

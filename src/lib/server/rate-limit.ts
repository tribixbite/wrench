/**
 * IP-based sliding-window rate limiter (in-memory).
 *
 * Suitable for single-instance deployments (Railway single dyno).
 * For multi-instance deployments, replace with a Redis-backed solution.
 *
 * @example
 * const authLimiter = new RateLimiter({ limit: 10, windowMs: 60_000 });
 * if (authLimiter.isLimited(ip)) return json({ error: 'Too many requests' }, { status: 429 });
 */
export class RateLimiter {
  /** Maximum number of hits allowed within the window */
  private readonly limit: number;
  /** Window size in milliseconds */
  private readonly windowMs: number;
  /** Map of IP → sorted array of hit timestamps */
  private readonly store = new Map<string, number[]>();
  /** How often (ms) to sweep expired entries from the store */
  private readonly sweepIntervalMs: number;

  constructor(opts: { limit: number; windowMs: number; sweepIntervalMs?: number }) {
    this.limit = opts.limit;
    this.windowMs = opts.windowMs;
    this.sweepIntervalMs = opts.sweepIntervalMs ?? opts.windowMs * 10;
    this.startSweep();
  }

  /**
   * Returns true if the given key (typically an IP address) has exceeded
   * the allowed request count within the sliding window, and records the hit.
   *
   * @param key - IP address or other identifier
   */
  isLimited(key: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    const hits = (this.store.get(key) ?? []).filter((t) => t > cutoff);
    hits.push(now);
    this.store.set(key, hits);

    return hits.length > this.limit;
  }

  /** Remove all entries whose last hit is older than the window. */
  private sweep(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [key, hits] of this.store) {
      if (hits[hits.length - 1] <= cutoff) this.store.delete(key);
    }
  }

  /**
   * Schedule periodic sweeps using a non-blocking interval.
   * `unref()` ensures the timer won't prevent the process from exiting.
   */
  private startSweep(): void {
    const timer = setInterval(() => this.sweep(), this.sweepIntervalMs);
    // Node.js / Bun — unref so timer doesn't block process exit
    if (typeof timer === 'object' && 'unref' in timer) timer.unref();
  }
}

/**
 * Shared rate limiter instances for auth routes.
 *
 * Login / register / forgot-password: 10 attempts per IP per 15 minutes.
 * Email verification resend: 5 attempts per IP per minute.
 */
export const authLimiter = new RateLimiter({ limit: 10, windowMs: 15 * 60_000 });
export const verifyResendLimiter = new RateLimiter({ limit: 5, windowMs: 60_000 });

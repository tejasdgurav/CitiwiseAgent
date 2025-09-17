type Key = string

// Simple in-memory rate limiter for demo/prototype
// windowMs: time window in ms, max: max hits per window
const buckets = new Map<Key, { count: number; resetAt: number }>()

export function rateLimit({ key, windowMs = 10_000, max = 10 }: { key: string; windowMs?: number; max?: number }) {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }
  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count += 1
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt }
}

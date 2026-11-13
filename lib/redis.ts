// Redis cache client backed by Upstash Redis (serverless HTTP REST).
//
// Credentials come from .env / hosting env vars:
//   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
//   UPSTASH_REDIS_REST_TOKEN=...
//
// When these are not set, a no-op stub is used so the app keeps working and
// caching simply becomes a pass-through. If a request to Upstash fails, the
// operation degrades to "no cache" instead of throwing inside a route handler.

import { Redis } from '@upstash/redis'

const restUrl = process.env.UPSTASH_REDIS_REST_URL
const restToken = process.env.UPSTASH_REDIS_REST_TOKEN

function createRedisClient(): Redis | null {
  if (restUrl && restToken) {
    return new Redis({ url: restUrl, token: restToken })
  }

  try {
    // Reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN itself.
    return Redis.fromEnv()
  } catch {
    return null
  }
}

const client = createRedisClient()

// No-op stub used when Redis is not configured (or as a safe fallback).
const noop = {
  get: async (_key: string) => null as unknown,
  set: async (_key: string, _value: unknown) => 'OK',
  setex: async (_key: string, _ttl: number, _value: unknown) => 'OK',
  del: async (..._keys: string[]) => 0,
  keys: async (_pattern: string): Promise<string[]> => [],
}

/**
 * Collect keys matching `pattern` with SCAN instead of KEYS. KEYS blocks the
 * whole database while scanning; the Upstash best-practices guidance is to
 * prefer SCAN for pattern lookups.
 */
async function scanAllKeys(client: Redis, pattern: string): Promise<string[]> {
  const found: string[] = []
  let cursor = '0'

  do {
    const [next, keys] = await client.scan(cursor, { match: pattern, count: 100 })
    found.push(...(keys ?? []))
    cursor = next
  } while (cursor !== '0')

  return found
}

function wrap(client: Redis) {
  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn()
    } catch (err) {
      console.error('[redis] operation failed:', (err as Error)?.message ?? err)
      return fallback
    }
  }

  return {
    // @upstash/redis auto-serializes values (objects, arrays, numbers...) and
    // deserializes them on get — no JSON.stringify/parse needed at call sites.
    get: (key: string) => safe(() => client.get<unknown>(key), null as unknown),
    set: (key: string, value: unknown) => safe(() => client.set(key, value), 'OK'),
    setex: (key: string, ttl: number, value: unknown) =>
      safe(() => client.setex(key, ttl, value), 'OK'),
    del: (...keys: string[]) => safe(() => client.del(...keys), 0),
    keys: (pattern: string) => safe(() => scanAllKeys(client, pattern), [] as string[]),
  }
}

export const redis = client ? wrap(client) : noop

export const CACHE_KEYS = {
  USER_SNIPPETS: (userId: string) => `user_snippets:${userId}`,
  SNIPPET_SEARCH: (userId: string, query: string) => `search:${userId}:${query}`,
}

export const CACHE_TTL = {
  USER_SNIPPETS: 300, // 5 minutes
  SEARCH_RESULTS: 600, // 10 minutes
}
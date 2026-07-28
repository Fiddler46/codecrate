// Redis is temporarily disabled. To re-enable, comment out the no-op stub below
// and uncomment the real client block.

// -- Real client (disabled) --
// import Redis from 'ioredis'
//
// const redis = new Redis({
//   host: process.env.REDIS_HOST || 'localhost',
//   port: parseInt(process.env.REDIS_PORT || '6379'),
//   password: process.env.REDIS_PASSWORD,
//   retryDelayOnFailover: 100,
//   enableReadyCheck: false,
//   maxRetriesPerRequest: null,
// })
// ----------------------------

// -- No-op stub --
const redis = {
  get: async (_key: string) => null,
  set: async (_key: string, _value: string) => 'OK',
  setex: async (_key: string, _ttl: number, _value: string) => 'OK',
  del: async (..._keys: string[]) => 0,
  keys: async (_pattern: string): Promise<string[]> => [],
}
// ----------------

export { redis }

export const CACHE_KEYS = {
  USER_SNIPPETS: (userId: string) => `user_snippets:${userId}`,
  SNIPPET_SEARCH: (userId: string, query: string) => `search:${userId}:${query}`,
}

export const CACHE_TTL = {
  USER_SNIPPETS: 300,  // 5 minutes
  SEARCH_RESULTS: 600, // 10 minutes
}
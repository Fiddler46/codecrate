
import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

export { redis }

export const CACHE_KEYS = {
  USER_SNIPPETS: (userId: string) => `user_snippets:${userId}`,
  SNIPPET_SEARCH: (userId: string, query: string) => `search:${userId}:${query}`,
}

export const CACHE_TTL = {
  USER_SNIPPETS: 300, // 5 minutes
  SEARCH_RESULTS: 600, // 10 minutes
}

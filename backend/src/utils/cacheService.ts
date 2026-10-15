/**
 * Redis Cache Service (Bonus Feature)
 * 
 * Caches the active campaigns list to reduce read database load.
 * Gracefully degrades if Redis is unavailable or uninstalled.
 */

let redisClient: any = null;
let isRedisConnected = false;

// In-memory fallback cache when Redis is offline or not installed
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

const initRedis = async () => {
  if (redisClient) return;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    // Dynamic import to avoid crash if ioredis isn't installed in local dev
    // @ts-ignore
    const { default: Redis } = await import('ioredis');
    
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: (times: number) => {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('Redis connected successfully (Campaign list caching active).');
    });

    redisClient.on('error', (err: any) => {
      isRedisConnected = false;
      // Log connection warning once without crashing
    });

    await redisClient.connect().catch(() => {
      isRedisConnected = false;
    });
  } catch {
    // ioredis not installed; fallback to memory cache
    isRedisConnected = false;
  }
};

// Initialize on module load
initRedis().catch(() => {});

export const cacheService = {
  /**
   * Get cached data by key
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      if (isRedisConnected && redisClient) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch {
      // Fall through to memory cache
    }

    // Fallback in-memory cache check
    const entry = memoryCache.get(key);
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        return entry.value as T;
      }
      memoryCache.delete(key);
    }

    return null;
  },

  /**
   * Set cached data with TTL (in seconds)
   */
  set: async (key: string, value: any, ttlSeconds: number = 60): Promise<void> => {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      }
    } catch {
      // Fall through to memory cache
    }

    // Fallback in-memory cache
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  /**
   * Delete cached key (Cache invalidation)
   */
  del: async (key: string): Promise<void> => {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.del(key);
      }
    } catch {
      // Ignore
    }
    memoryCache.delete(key);
  },

  /**
   * Status check
   */
  isRedisActive: (): boolean => isRedisConnected,
};

export default cacheService;

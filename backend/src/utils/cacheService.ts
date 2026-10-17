
let redisClient: any = null;
let isRedisConnected = false;

const memoryCache = new Map<string, { value: any; expiresAt: number }>();

const initRedis = async () => {
  if (redisClient) return;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {

    const { default: Redis } = await import('ioredis');

    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('Redis connected successfully (Campaign list caching active).');
    });

    redisClient.on('error', (err: any) => {
      isRedisConnected = false;

    });

    await redisClient.connect().catch(() => {
      isRedisConnected = false;
    });
  } catch {

    isRedisConnected = false;
  }
};

initRedis().catch(() => {});

export const cacheService = {

  get: async <T>(key: string): Promise<T | null> => {
    try {
      if (isRedisConnected && redisClient) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch {

    }

    const entry = memoryCache.get(key);
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        return entry.value as T;
      }
      memoryCache.delete(key);
    }

    return null;
  },

  set: async (key: string, value: any, ttlSeconds: number = 60): Promise<void> => {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      }
    } catch {

    }

    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  del: async (key: string): Promise<void> => {
    try {
      if (isRedisConnected && redisClient) {
        await redisClient.del(key);
      }
    } catch {

    }
    memoryCache.delete(key);
  },

  isRedisActive: (): boolean => isRedisConnected,
};

export default cacheService;

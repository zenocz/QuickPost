import RedisClient from 'ioredis';

const WINDOW_MS = 60 * 1000; // 1 minute window
const WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 30;

// 1. In-Memory Storage for Development / Fallback
const inMemoryMap = new Map<string, number[]>();

if (typeof setInterval !== 'undefined') {
  const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
  const timer = setInterval(() => {
    cleanupInMemoryMap();
  }, CLEANUP_INTERVAL_MS);

  if (timer.unref) {
    timer.unref(); // Prevent blocking Node.js process exit
  }
}

export function cleanupInMemoryMap(): void {
  const now = Date.now();
  for (const [ip, timestamps] of inMemoryMap.entries()) {
    const valid = timestamps.filter((time) => now - time < WINDOW_MS);
    if (valid.length === 0) {
      inMemoryMap.delete(ip);
    } else {
      inMemoryMap.set(ip, valid);
    }
  }
}

export function resetRateLimiter(): void {
  inMemoryMap.clear();
}

// 2. Redis Client (Any Redis instance via REDIS_URL in .env)
let redisClient: RedisClient | null = null;

function getRedisClient(): RedisClient | null {
  if (redisClient) return redisClient;
  
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    redisClient = new RedisClient(redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    return redisClient;
  }
  
  return null;
}

export async function checkRateLimit(clientIp: string): Promise<{ success: boolean; limit: number; remaining: number }> {
  // Option A: Redis (Docker, VPS, or any cloud Redis provided via REDIS_URL)
  const redis = getRedisClient();
  
  if (redis) {
    try {
      if (redis.status === 'wait') {
        await redis.connect();
      }
      
      const key = `quickpost:ratelimit:${clientIp}`;
      const currentCount = await redis.incr(key);

      if (currentCount === 1) {
        await redis.expire(key, WINDOW_SECONDS);
      }

      if (currentCount > MAX_REQUESTS_PER_WINDOW) {
        return {
          success: false,
          limit: MAX_REQUESTS_PER_WINDOW,
          remaining: 0,
        };
      }

      return {
        success: true,
        limit: MAX_REQUESTS_PER_WINDOW,
        remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - currentCount),
      };
    } catch {
      // Fallback to In-Memory if Redis connection fails or times out
    }
  }

  // Option B: In-Memory Fallback (If REDIS_URL is not set or Redis fails)
  const now = Date.now();
  const timestamps = inMemoryMap.get(clientIp) || [];
  const validTimestamps = timestamps.filter((time) => now - time < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    inMemoryMap.set(clientIp, validTimestamps);
    return {
      success: false,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: 0,
    };
  }

  validTimestamps.push(now);
  inMemoryMap.set(clientIp, validTimestamps);

  return {
    success: true,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining: MAX_REQUESTS_PER_WINDOW - validTimestamps.length,
  };
}

import Redis from "ioredis";
import { env } from "@/config/env";

const NAMESPACE = "nomba";

let client: Redis | null = null;

function getClient(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

    client.on("error", (err) => {
      console.error("Redis connection error:", err.message);
    });
  }

  return client;
}

export const nombaCache = {
  async get(key: string): Promise<string | null> {
    try {
      const redis = getClient();
      return await redis.get(`${NAMESPACE}:${key}`);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string, ttlSeconds: number) {
    try {
      const redis = getClient();
      await redis.set(`${NAMESPACE}:${key}`, value, "EX", ttlSeconds);
    } catch {
      // silently fail — cache is best-effort
    }
  },

  async delete(key: string) {
    try {
      const redis = getClient();
      await redis.del(`${NAMESPACE}:${key}`);
    } catch {
      // silently fail
    }
  },

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // invalid JSON, fall through to factory
      }
    }

    const value = await factory();
    await this.set(key, JSON.stringify(value), ttlSeconds);
    return value;
  },
};

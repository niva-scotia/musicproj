import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class RedisConnection {
  private client: RedisClientType | null = null;

  async connect(): Promise<RedisClientType> {
    if (this.client?.isOpen) return this.client;

    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => console.error('❌ Redis error:', err));
    this.client.on('connect', () => console.log('✅ Redis connected'));

    await this.client.connect();
    return this.client;
  }

  getClient(): RedisClientType {
    if (!this.client?.isOpen) throw new Error('Redis not connected');
    return this.client;
  }

  // Cache helpers
  async get(key: string): Promise<string | null> {
    return this.getClient().get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.getClient().setEx(key, ttlSeconds, value);
    } else {
      await this.getClient().set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.getClient().del(key);
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

export const redisDb = new RedisConnection();
export default redisDb;
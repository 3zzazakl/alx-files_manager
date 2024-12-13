import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);

    this.client.on('error', (error) => {
      console.error('Redis error:', error);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    try {
      const value = await this.getAsync(key);
      return value;
    } catch (error) {
      console.error('Error getting key from Redis:', error);
      return null;
    }
  }

  async set(key, value, durationInSeconds) {
    try {
      await this.client.setex(key, durationInSeconds, String(value));
    } catch (error) {
      console.error('Error setting key in Redis:', error);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting key in Redis:', error);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;

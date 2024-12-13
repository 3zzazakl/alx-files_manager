import Redis from 'ioredis';

class RedisClient {
  constructor() {
    this.client = new Redis();

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  async isAlive() {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error) {
      console.error('Redis ping error:', error);
      return false;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
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

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
      return false;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (error) {
      console.error('Error getting key:', error);
      return null;
    }
  }

  async set(key, value, durationInSeconds) {
    try {
      await this.client.setex(key, durationInSeconds, String(value));
    } catch (error) {
      console.error('Error setting key:', error);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting key:', error);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;

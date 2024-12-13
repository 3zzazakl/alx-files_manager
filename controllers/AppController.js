import redisClient from '../utils/redis';

class AppController {
  static async getStatus(req, res) {
    try {
      const redisStatus = redisClient.isAlive();
      return res.status(200).json({ redis: redisStatus });
    } catch (error) {
      return res.status(500).json({ error: 'An error occurred while checking Redis status' });
    }
  }

  static async getStats(req, res) {
    try {
      const value = await redisClient.get('someKey');
      return res.status(200).json({ value });
    } catch (error) {
      return res.status(500).json({ error: 'An error occurred while getting Redis stats' });
    }
  }
}

export default AppController;

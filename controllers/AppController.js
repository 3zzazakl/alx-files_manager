import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static async getStatus(req, res) {
    try {
      const redisStatus = redisClient.isAlive();
      const dbStatus = dbClient.isAlive();

      return res.status(200).json({
        redis: redisStatus,
        db: dbStatus,
      });
    } catch (error) {
      return res.status(500).json({ error: 'An error occurred' });
    }
  }

  static async getStats(req, res) {
    try {
      const nbUsers = await dbClient.nbUsers();
      const nbFiles = await dbClient.nbFiles();

      return res.status(200).json({
        users: nbUsers,
        files: nbFiles,
      });
    } catch (error) {
      return res.status(500).json({ error: 'An error occurred' });
    }
  }
}

export default AppController;

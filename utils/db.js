import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const uri = `mongodb://${DB_HOST}:${DB_PORT}`;
class DBClient {
  constructor() {
    MongoClient(uri, { useUniFiedTopology: true }, (err, client) => {
      if (!err) {
        this.db = client.db(DB_DATABASE);
        this.usersCollection = this.db.collection('users');
        this.filesCollection = this.db.collection('files');
      } else {
        console.error(err.message);
        this.db = false;
      }
    });
  }

  isAlive() {
    try {
      return Boolean(this.db);
    } catch (error) {
      console.log('Error connecting to MongoDB:', error);
      return false;
    } finally {
      this.client.close();
    }
  }

  async nbUsers() {
    try {
      const numberOfUsers = await this.usersCollection.countDocuments();
      return numberOfUsers;
    } catch (error) {
      console.log('Error getting user count from MongoDB:', error);
      return 0;
    } finally {
      await this.client.close();
    }
  }

  async nbFiles() {
    try {
      const numberOfFiles = await this.filesCollection.countDocuments();
      return numberOfFiles;
    } catch (error) {
      console.log('Error getting file count from MongoDB:', error);
      return 0;
    } finally {
      await this.client.close();
    }
  }
}

const dbClient = new DBClient();
export default dbClient;

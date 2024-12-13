import { MongoClient } from 'mongodb';

const host = process.env.database || 'localhost';
const port = process.env.port || 27017;
const database = process.env.database || 'files_manager';
const uri = `mongodb://${host}:${port}`;
class DBClient {
  constructor() {
    MongoClient(uri, { useNewUrlParser: true, useUniFiedTopology: true }, (err, client) => {
      if (!err) {
        this.db = client.db(database);
        this.usersCollection = this.db.collection('users');
        this.filesCollection = this.db.collection('files');
      } else {
        console.error('Error connecting to MongoDB:', err);
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

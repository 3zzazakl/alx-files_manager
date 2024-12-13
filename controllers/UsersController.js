import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const dbName = 'files_manager';
const collectionName = 'users';

const postNew = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const sha1Hash = crypto.createHash('sha1').update(password).digest('hex');

    const newUser = {
      email,
      password: sha1Hash,
    };

    const result = await collection.insertOne(newUser);

    return res.status(201).json({
      id: result.insertedId,
      email,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'An error occurred while creating the user' });
  } finally {
    await client.close();
  }
};

export default {
  postNew,
};

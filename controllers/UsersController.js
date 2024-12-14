import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import userUtils from '../utils/user';

const userQueue = new Queue('userQueue');

const UsersController = {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email) { return response.status(400).send({ error: 'Missing email' }); }

    if (!password) { return response.status(400).send({ error: 'Missing password' }); }

    const emailExists = await dbClient.usersCollection.findOne({ email });

    if (emailExists) { return response.status(400).send({ error: 'Email already exists' }); }

    const sha1Password = sha1(password);

    let result;

    try {
      result = await dbClient.usersCollection.insertOne({
        email,
        password: sha1Password,
      });
    } catch (error) {
      await userQueue.add({});
      return response.status(500).send({ error: 'An error occurred while creating the user' });
    }

    const user = {
      id: result.insertedId,
      email,
    };

    await userQueue.add({
      userId: result.insertedId.toString(),
    });

    return response.status(201).send(user);
  }

  static async getMe(request, response) {
    const { userId } = await userUtils.getUserIdAndKey(request);
    const user = await userUtils.getUser({ _id: ObjectId(userId) });

    if (!user) { return response.status(401).send({ error: 'Unauthorized' }); }

    const processUser = { id: user._id, ...user };
    delete processUser._id;
    delete processUser.password;

    return response.status(200).send(processUser);
  }
}

export default UsersController;

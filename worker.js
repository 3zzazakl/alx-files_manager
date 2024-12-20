import Queue from 'bull';
import { ObjectId } from 'mongodb';
import { promises as fspromises } from 'fs';
import fileUtils from './utils/file';
import userUtils from './utils/user';
import basicUtils from './utils/basic';

const imageThumbnail = require('image-thumbnail');

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  if (!basicUtils.isValidId(fileId) || !basicUtils.isValidId(userId)) throw new Error('File not found');

  const file = await fileUtils.getFile({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) throw new Error('File not found');

  const { localPath } = file;
  const options = {};
  const widths = [500, 250, 100];

  widths.forEach(async (width) => {
    options.width = width;
    try {
      const thumbnail = await imageThumbnail(localPath, options);
      await fspromises.writeFile(`${localPath}_${width}`, thumbnail);
    } catch (error) {
      console.error(error.message);
    }
  });
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) throw new Error('Missing userId');

  if (!basicUtils.isValidId(userId)) throw new Error('User not found');

  const user = await userUtils.getUser({ _id: ObjectId(userId) });
  if (!user) throw new Error('User not found');
  console.log(`Welcome ${user.email}!`);
});

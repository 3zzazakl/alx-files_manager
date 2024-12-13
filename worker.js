import User from '../models/User';
import File from '../models/File';

const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const path = require('path');

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await file.findOne({ where: { id: fileId, userId } });
  if (!file) throw new Error('File not found');

  const filePath = path.join(__dirname, 'uploads', file.name);
  const sizes = [500, 250, 100];

  for (const size of sizes) {
    const thumbnail = await imageThumbnail(filePath, { width: size });
    const thumbnailPath = `${filePath}_${size}`;
    fs.writeFileSync(thumbnailPath, thumbnail);
  }
});

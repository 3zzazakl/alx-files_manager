import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uuidV4 } from 'mongodb/lib/core/utils';
import User from '../models/User';
import File from '../models/File';
import redisClient from '../utils/redis';

const UPLOAD_DIR = process.env.FOLDER_PATH || '/tmp/files_manager';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function decodeAuthHeader(authHeader) {
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [email, password] = credentials.split(':');
  return { email, password };
}

export const postUpload = async (req, res) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }

  const { email, password } = decodeAuthHeader(authorization);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!type || !['image', 'folder', 'file'].includes(type)) {
      return res.status(400).json({ error: 'Type is required and must be one of image, folder or file' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Data is required for file uploads' });
    }

    if (parentId !== 0) {
      const parentFile = await File.findById(parentId);

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent file does not exist' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent file must be a folder' });
      }
    }

    let localPath = null;

    if (type !== 'folder') {
      const buffer = Buffer.from(data, 'base64');
      const fileName = uuidV4();
      localPath = path.join(UPLOAD_DIR, fileName);

      fs.writeFileSync(localPath, buffer);
    }

    const newFile = new File({
      userId: user.id,
      name,
      type,
      isPublic,
      parentId,
      localPath: localPath || null,
    });

    await newFile.save();
    return res.status(201).json(newFile);
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while uploading the file' });
  }
};

async function getUserFromToken(token) {
  const user = await User.findOne({ token });
  return user;
}

module.exports.getShow = async (req, res) => {
  const { id } = req.params;
  const token = req.headers['x-token'];

  try {
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const file = await File.findOne({ _id: id, userId: user.id });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.json;
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while getting the file' });
  }
};

module.exports.getIndex = async (req, res) => {
  const { parentId = 0, page 0 } = req.query;
  const token = req.headers['x-token'];

  try {
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const files = await File.find({ userId: user.id, parentId })
      .skip(page * 20)
      .limit(20)
    
    return res.json(files);
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred while getting the files' });
  }
};

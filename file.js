import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fspromises } from 'fs';
import dbClient from './db';
import basicUtils from './basic';
import userUtils from './user';

const fileUtils = {
  async validateBody(request) {
    const {
      name, type, isPublic = false, data,
    } = request.body;

    let { parentId = 0 } = request.body;

    const typesAllowed = ['image', 'folder', 'file'];
    let msg = null;

    if (parentId === '0') parentId = 0;

    if (!name) {
      msg = 'Missing name';
    } else if (!type || !typesAllowed.includes(type)) {
      msg = 'Missing type';
    } else if (!data && type !== 'folder') {
      msg = 'Missing data';
    } else if (parentId && parentId !== '0') {
      let file;

      if (basicUtils.isValidId(parentId)) {
        file = await this.getFile({
          _id: ObjectId(parentId),
        });
      } else {
        file = null;
      }

      if (!file) {
        msg = 'Parent file not found';
      } else if (file.type !== 'folder') {
        msg = 'Parent file must be a folder';
      }
    }

    const obj = {
      error: msg,
      fileParams: {
        name,
        type,
        isPublic,
        parentId,
        data,
      },
    };

    return obj;
  },

  async getFile(query) {
    const file = await dbClient.filesCollection.findOne(query);
    return file;
  },

  async getFilesOfParentId(query) {
    const fileList = await dbClient.filesCollection.aggregate(query);
    return fileList;
  },

  async saveFile(userId, fileParams, FOLDER_PATH) {
    const {
      name, type, isPublic, data,
    } = fileParams;
    let { parentId } = fileParams;

    if (parentId !== 0) parentId = ObjectId(parentId);

    const query = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId,
    };

    if (fileParams.type !== 'folder') {
      const fileNameUUID = uuidv4();

      const fileDataDecoded = Buffer.from(data, 'base64');

      const path = `${FOLDER_PATH}/${fileNameUUID}`;

      query.localPath = path;

      try {
        await fspromises.mkdir(FOLDER_PATH, { recursive: true });
        await fspromises.writeFile(path, fileDataDecoded);
      } catch (error) {
        return { error: error.message, code: 400 };
      }
    }

    const result = await dbClient.filesCollection.insertOne(query);

    const file = this.processFile(query);
    const newFile = { id: result.insertedId, ...file };
    return { error: null, newFile };
  },

  async updateFile(query, set) {
    const fileList = await dbClient.filesCollection.findOneAndUpdat(
      query,
      set,
      { returnOriginal: false },
    );
    return fileList;
  },

  async publishUnpublis(request, setPublish) {
    const { id: fileId } = request.params;
    if (!basicUtils.isValidId(fileId)) return { error: 'Unauthorized', code: 401 };
    const { userId } = await userUtils.getUserAndKey(request);

    if (!basicUtils.isValidId(userId)) return { error: 'Unauthorized', code: 401 };

    const user = await userUtils.getUser({ _id: ObjectId(userId) });

    if (!user) return { error: 'Unauthorized', code: 401 };

    const file = await this.getFile({ _id: ObjectId(fileId), userId: ObjectId(userId) });

    if (!file) return { error: 'Not found', code: 404 };

    const result = await this.updateFile({ _id: ObjectId(fileId), userId: ObjectId(userId) },
      { $set: { isPublic: setPublish } });

    const {
      _id: id, userId: resultUserId, name, type, isPublic, parentId,
    } = result.value;

    const updateFile = {
      id,
      userId: resultUserId,
      name,
      type,
      isPublic,
      parentId,
    };
    return { error: null, code: 200, updateFile };
  },
  processFile(doc) {
    const file = { id: doc._id, ...doc };

    delete file.localPath;
    delete file._id;
    return file;
  },

  isOwnerAndPublic(file, userId) {
    if (
      (!file.isPublic && !userId)
      || (userId && file.userId.toString() !== userId && !file.isPublic)
    ) { return false; }
    return true;
  },
  async getFileData(file, size) {
    let { localPath } = file;
    let data;

    if (size) localPath = `${localPath}_${size}`;

    try {
      data = await fspromises.readFile(localPath);
    } catch (error) {
      return { error: 'Not found', code: 404 };
    }
    return { data };
  },
};

export default fileUtils;

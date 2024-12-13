import express from 'express';
import AppController from '../controllers/AppController';
import UsersController, { getMe } from '../controllers/UsersController';
import { getConnect, getDisconnect } from '../controllers/AuthController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);
router.get('/users/me', getMe);
router.post('/users', UsersController.postNew);

export default router;

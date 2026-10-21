import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

const router = Router();

router.get('/me', authenticate, (req, res, next) => userController.getProfile(req, res, next));
router.patch('/me', authenticate, (req, res, next) => userController.updateProfile(req, res, next));
router.post('/me/avatar', authenticate, uploadSingle, (req, res, next) => userController.uploadAvatar(req, res, next));

export default router;

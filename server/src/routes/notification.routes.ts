import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req, res, next) => notificationController.list(req, res, next));
router.post('/read', authenticate, (req, res, next) => notificationController.markRead(req, res, next));
router.get('/unread-count', authenticate, (req, res, next) => notificationController.unreadCount(req, res, next));

export default router;

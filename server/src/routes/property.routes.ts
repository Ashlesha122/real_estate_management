import { Router } from 'express';
import { propertyController } from '../controllers/property.controller';
import { authenticate } from '../middleware/auth';
import { authorize, requireVerified } from '../middleware/rbac';
import { uploadMultiple } from '../middleware/upload';
import { UserRole } from '@estateflow/shared';

const router = Router();

router.post('/', authenticate, authorize(UserRole.OWNER), requireVerified, (req, res, next) => propertyController.create(req, res, next));
router.get('/my', authenticate, authorize(UserRole.OWNER), (req, res, next) => propertyController.getMyListings(req, res, next));
router.get('/assigned', authenticate, authorize(UserRole.BROKER), (req, res, next) => propertyController.getAssignedListings(req, res, next));
router.get('/:id', (req, res, next) => propertyController.getById(req, res, next));
router.patch('/:id', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => propertyController.update(req, res, next));
router.delete('/:id', authenticate, authorize(UserRole.OWNER), (req, res, next) => propertyController.delete(req, res, next));
router.post('/:id/publish', authenticate, authorize(UserRole.OWNER), requireVerified, (req, res, next) => propertyController.publish(req, res, next));
router.patch('/:id/status', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => propertyController.updateStatus(req, res, next));
router.post('/:id/media', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), uploadMultiple, (req, res, next) => propertyController.uploadMedia(req, res, next));
router.delete('/:id/media/:mediaId', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => propertyController.deleteMedia(req, res, next));
router.patch('/:id/media/reorder', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => propertyController.reorderMedia(req, res, next));

export default router;

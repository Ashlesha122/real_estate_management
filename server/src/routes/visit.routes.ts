import { Router } from 'express';
import { visitController } from '../controllers/visit.controller';
import { authenticate } from '../middleware/auth';
import { authorize, requireVerified } from '../middleware/rbac';
import { UserRole } from '@estateflow/shared';

const router = Router();

router.post('/', authenticate, authorize(UserRole.BUYER), requireVerified, (req, res, next) => visitController.create(req, res, next));
router.get('/my', authenticate, authorize(UserRole.BUYER), (req, res, next) => visitController.getMyVisits(req, res, next));
router.get('/handler', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => visitController.getHandlerVisits(req, res, next));
router.patch('/:id', authenticate, (req, res, next) => visitController.update(req, res, next));

export default router;

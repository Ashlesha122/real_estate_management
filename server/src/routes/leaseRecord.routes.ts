import { Router } from 'express';
import { leaseRecordController } from '../controllers/leaseRecord.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { UserRole } from '@estateflow/shared';

const router = Router();

router.get('/', authenticate, authorize(UserRole.OWNER), (req, res, next) => leaseRecordController.list(req, res, next));
router.post('/', authenticate, authorize(UserRole.OWNER), (req, res, next) => leaseRecordController.create(req, res, next));
router.get('/:id', authenticate, authorize(UserRole.OWNER), (req, res, next) => leaseRecordController.getById(req, res, next));
router.patch('/:id', authenticate, authorize(UserRole.OWNER), (req, res, next) => leaseRecordController.update(req, res, next));

export default router;

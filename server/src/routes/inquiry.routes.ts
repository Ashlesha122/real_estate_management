import { Router } from 'express';
import { inquiryController } from '../controllers/inquiry.controller';
import { authenticate } from '../middleware/auth';
import { authorize, requireVerified } from '../middleware/rbac';
import { UserRole } from '@estateflow/shared';

const router = Router();

router.post('/', authenticate, authorize(UserRole.BUYER), requireVerified, (req, res, next) => inquiryController.create(req, res, next));
router.get('/my', authenticate, authorize(UserRole.BUYER), (req, res, next) => inquiryController.getMyInquiries(req, res, next));

export default router;

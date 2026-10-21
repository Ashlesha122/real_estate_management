import { Router } from 'express';
import { inquiryController } from '../controllers/inquiry.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { UserRole } from '@estateflow/shared';

const router = Router();

router.get('/', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => inquiryController.getLeads(req, res, next));
router.get('/:id', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => inquiryController.getLead(req, res, next));
router.patch('/:id', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => inquiryController.updateStage(req, res, next));
router.get('/:id/notes', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => inquiryController.getNotes(req, res, next));
router.post('/:id/notes', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => inquiryController.addNote(req, res, next));
router.get('/:id/activities', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => inquiryController.getActivities(req, res, next));

export default router;

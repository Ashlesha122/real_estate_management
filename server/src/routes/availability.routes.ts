import { Router } from 'express';
import { availabilityController } from '../controllers/availability.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { UserRole } from '@estateflow/shared';

const router = Router();

router.get('/rules', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => availabilityController.getRules(req, res, next));
router.put('/rules', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => availabilityController.replaceRules(req, res, next));
router.get('/blocks', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => availabilityController.getBlocks(req, res, next));
router.post('/blocks', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => availabilityController.addBlock(req, res, next));
router.delete('/blocks/:id', authenticate, authorize(UserRole.OWNER, UserRole.BROKER), (req, res, next) => availabilityController.deleteBlock(req, res, next));
router.get('/:handlerId/slots', authenticate, (req, res, next) => availabilityController.getSlots(req, res, next));

export default router;

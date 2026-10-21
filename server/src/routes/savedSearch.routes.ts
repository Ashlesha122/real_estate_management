import { Router } from 'express';
import { savedSearchController } from '../controllers/savedSearch.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req, res, next) => savedSearchController.list(req, res, next));
router.post('/', authenticate, (req, res, next) => savedSearchController.create(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => savedSearchController.delete(req, res, next));

export default router;

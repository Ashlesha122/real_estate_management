import { Router } from 'express';
import { wishlistController } from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req, res, next) => wishlistController.list(req, res, next));
router.post('/', authenticate, (req, res, next) => wishlistController.add(req, res, next));
router.delete('/:propertyId', authenticate, (req, res, next) => wishlistController.remove(req, res, next));
router.get('/compare', authenticate, (req, res, next) => wishlistController.compare(req, res, next));

export default router;

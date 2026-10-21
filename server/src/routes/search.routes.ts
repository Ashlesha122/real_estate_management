import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public search - auth is optional (for wishlist status)
const optionalAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, (req, res, next) => searchController.search(req, res, next));
router.get('/bbox', optionalAuth, (req, res, next) => searchController.searchBBox(req, res, next));

export default router;

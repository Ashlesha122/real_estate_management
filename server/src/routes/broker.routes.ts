import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { userRepository } from '../repositories/user.repository';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination';
import { UserRole } from '@estateflow/shared';

const router = Router();

router.get('/', authenticate, authorize(UserRole.OWNER), async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const search = req.query.search as string | undefined;
    const result = await userRepository.findBrokers(search, page, limit);
    res.json(buildPaginatedResponse(result.rows, result.total, { page, limit, offset: (page - 1) * limit }));
  } catch (error) { next(error); }
});

export default router;

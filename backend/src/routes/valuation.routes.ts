import { Router } from 'express';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createValuation,
  listValuations,
  getValuationById,
  updateValuation,
  deleteValuation
} from '../controllers/valuation.controller';
import { valuationSchema } from '../validators/valuation.validator';

const router = Router();

router.get('/', authorize('read', 'valuation'), listValuations);
router.post('/', validate(valuationSchema), authorize('create', 'valuation'), createValuation);
router.get('/:id', authorize('read', 'valuation'), getValuationById);
router.put('/:id', validate(valuationSchema), authorize('update', 'valuation'), updateValuation);
router.delete('/:id', authorize('delete', 'valuation'), deleteValuation);

export default router;

import { Router } from 'express';
import {
  createSubmission,
  getMySubmissions,
  updateViews,
} from '../controllers/submissionController';
import { authenticate, requireCreator } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, requireCreator, createSubmission);

router.get('/my', authenticate, requireCreator, getMySubmissions);

router.patch('/:id/views', updateViews);

export default router;

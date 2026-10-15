import { Router } from 'express';
import {
  createSubmission,
  getMySubmissions,
  updateViews,
} from '../controllers/submissionController';
import { authenticate, requireCreator } from '../middleware/auth';

const router = Router();

// POST /api/submissions - Creator only: Submit a post
router.post('/', authenticate, requireCreator, createSubmission);

// GET /api/submissions/my - Creator only: List their submissions with earnings
router.get('/my', authenticate, requireCreator, getMySubmissions);

// PATCH /api/submissions/:id/views - NO auth required: Update post views & payout
router.patch('/:id/views', updateViews);

export default router;

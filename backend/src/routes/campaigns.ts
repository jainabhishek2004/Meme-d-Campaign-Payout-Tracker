import { Router } from 'express';
import {
  createCampaign,
  getActiveCampaigns,
  getMyCampaigns,
  getCampaignById,
} from '../controllers/campaignController';
import { authenticate, requireBrand } from '../middleware/auth';

const router = Router();

// POST /api/campaigns - Brand only: Create new campaign
router.post('/', authenticate, requireBrand, createCampaign);

// GET /api/campaigns - Public/Creator: List all active campaigns
router.get('/', getActiveCampaigns);

// GET /api/campaigns/my - Brand only: List all campaigns by that brand
router.get('/my', authenticate, requireBrand, getMyCampaigns);

// GET /api/campaigns/:id - Brand only: See full campaign details
router.get('/:id', authenticate, requireBrand, getCampaignById);

export default router;

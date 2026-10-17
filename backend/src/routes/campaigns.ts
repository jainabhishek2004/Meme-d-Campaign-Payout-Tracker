import { Router } from 'express';
import {
  createCampaign,
  getActiveCampaigns,
  getMyCampaigns,
  getCampaignById,
} from '../controllers/campaignController';
import { authenticate, requireBrand } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, requireBrand, createCampaign);

router.get('/', getActiveCampaigns);

router.get('/my', authenticate, requireBrand, getMyCampaigns);

router.get('/:id', authenticate, requireBrand, getCampaignById);

export default router;

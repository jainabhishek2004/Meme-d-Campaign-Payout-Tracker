import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Campaign, { IMilestone } from '../models/Campaign';
import { AppError } from '../middleware/errorHandler';
import cacheService from '../utils/cacheService';

/**
 * Create a new campaign (Brand only)
 * POST /api/campaigns
 */
export const createCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, platform, totalBudget, milestones } = req.body ?? {};

    if (typeof name !== 'string' || !name.trim() || !platform || totalBudget === undefined || !milestones) {
      throw new AppError('Please provide name, platform, totalBudget, and milestones', 400);
    }

    if (!['Instagram', 'YouTube'].includes(platform)) {
      throw new AppError('Platform must be either "Instagram" or "YouTube"', 400);
    }

    const parsedBudget = Number(totalBudget);
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      throw new AppError('totalBudget must be a positive number greater than 0', 400);
    }

    if (!Array.isArray(milestones) || milestones.length === 0) {
      throw new AppError('milestones must be a non-empty array with at least one milestone tier', 400);
    }

    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      if (typeof m !== 'object' || m === null) {
        throw new AppError(`Milestone tier #${i + 1} is invalid`, 400);
      }

      if (typeof m.viewThreshold !== 'number' || !Number.isSafeInteger(m.viewThreshold) || m.viewThreshold <= 0) {
        throw new AppError(
          `Milestone tier #${i + 1} viewThreshold must be a positive whole integer greater than 0 (no fractions)`,
          400
        );
      }

      if (typeof m.payout !== 'number' || !Number.isFinite(m.payout) || m.payout <= 0) {
        throw new AppError(`Milestone tier #${i + 1} payout must be a positive number greater than 0`, 400);
      }

      if (m.payout > parsedBudget) {
        throw new AppError(
          `Milestone tier #${i + 1} payout (₹${m.payout}) cannot exceed the total campaign budget (₹${parsedBudget})`,
          400
        );
      }
    }

    // Sort milestones ascending by viewThreshold
    const sortedMilestones: IMilestone[] = [...milestones].sort(
      (a, b) => a.viewThreshold - b.viewThreshold
    );

    // Validate unique thresholds and strictly increasing payouts
    const seenThresholds = new Set<number>();
    for (let i = 0; i < sortedMilestones.length; i++) {
      const current = sortedMilestones[i];

      if (seenThresholds.has(current.viewThreshold)) {
        throw new AppError(
          `Duplicate milestone threshold detected: ${current.viewThreshold} views. Each milestone threshold must be unique.`,
          400
        );
      }
      seenThresholds.add(current.viewThreshold);

      if (i > 0) {
        const previous = sortedMilestones[i - 1];
        if (current.payout <= previous.payout) {
          throw new AppError(
            `Invalid milestone ladder: ${current.viewThreshold} views pays ₹${current.payout}, which is not greater than the previous milestone of ${previous.viewThreshold} views paying ₹${previous.payout}. Higher view tiers must yield higher payouts.`,
            400
          );
        }
      }
    }

    const campaign = await Campaign.create({
      brand: req.user!.id,
      name: name.trim(),
      platform,
      totalBudget: parsedBudget,
      budgetSpent: 0,
      milestones: sortedMilestones,
      status: 'active',
    });

    // Invalidate Redis active campaigns cache on new campaign creation
    await cacheService.del('campaigns:active:v2');

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all active campaigns for creators/public
 * GET /api/campaigns
 * Caches campaign list with Redis (Bonus feature)
 */
export const getActiveCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cacheKey = 'campaigns:active:v2';
    const cachedCampaigns = await cacheService.get<any[]>(cacheKey);

    if (cachedCampaigns) {
      res.status(200).json({
        campaigns: cachedCampaigns,
        fromCache: true,
      });
      return;
    }

    const campaigns = await Campaign.find({ status: 'active' })
      .populate('brand', 'name')
      .sort({ createdAt: -1 });

    // Cache campaigns in Redis with 60-second TTL
    await cacheService.set(cacheKey, campaigns, 60);

    res.status(200).json({
      campaigns,
      fromCache: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all campaigns owned by the authenticated brand
 * GET /api/campaigns/my
 */
export const getMyCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaigns = await Campaign.find({ brand: req.user!.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      campaigns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single campaign details including budgetSpent and budgetRemaining (Brand only)
 * GET /api/campaigns/:id
 */
export const getCampaignById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid campaign ID format', 400);
    }

    const campaign = await Campaign.findById(id).populate('brand', 'name email');

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    // Ensure the requesting brand owns this campaign
    if (campaign.brand._id.toString() !== req.user!.id) {
      throw new AppError('Forbidden: You do not own this campaign', 403);
    }

    res.status(200).json({
      campaign: {
        _id: campaign._id,
        name: campaign.name,
        platform: campaign.platform,
        brand: campaign.brand,
        totalBudget: campaign.totalBudget,
        budgetSpent: campaign.budgetSpent,
        budgetRemaining: campaign.budgetRemaining,
        milestones: campaign.milestones,
        status: campaign.status,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Submission from '../models/Submission';
import Campaign from '../models/Campaign';
import { calculatePayout } from '../utils/payoutCalculator';
import { normalizePostLink } from '../utils/normalizePostLink';
import { AppError } from '../middleware/errorHandler';

/**
 * Submit a post for a campaign (Creator only)
 * POST /api/submissions
 */
export const createSubmission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { campaignId, postLink } = req.body ?? {};

    if (!campaignId || typeof postLink !== 'string' || !postLink.trim()) {
      throw new AppError('Please provide campaignId and postLink', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      throw new AppError('Invalid campaignId format', 400);
    }

    if (postLink.trim().length > 2048) {
      throw new AppError('postLink must be 2048 characters or fewer', 400);
    }

    let normalizedLink: string;
    try {
      normalizedLink = normalizePostLink(postLink);
    } catch {
      throw new AppError('postLink must be a valid HTTP or HTTPS URL', 400);
    }

    const session = await mongoose.startSession();
    let submission: any = null;

    try {
      await session.withTransaction(async () => {
        submission = null;

        const campaign = await Campaign.findById(campaignId).session(session);
        if (!campaign) {
          throw new AppError('Campaign not found', 404);
        }

        if (campaign.status !== 'active') {
          throw new AppError('Cannot submit to an inactive or completed campaign', 400);
        }

        const postHostname = new URL(normalizedLink).hostname;
        const matchesCampaignPlatform = campaign.platform === 'Instagram'
          ? postHostname === 'instagram.com'
          : postHostname === 'youtube.com';
        if (!matchesCampaignPlatform) {
          throw new AppError(`postLink must be a ${campaign.platform} URL for this campaign`, 400);
        }

        if (campaign.totalBudget <= campaign.budgetSpent) {
          throw new AppError(
            'Cannot submit to this campaign: the campaign budget is completely exhausted',
            400
          );
        }

        // Compare normalized URLs as well, so older rows with tracking parameters
        // still match the same post. The unique index below handles concurrent inserts.
        const priorSubmissions = await Submission.find({
          creator: req.user!.id,
          campaign: campaignId,
        }).select('postLink').session(session);

        const duplicate = priorSubmissions.some((item) => {
          try {
            return normalizePostLink(item.postLink) === normalizedLink;
          } catch {
            return false;
          }
        });

        if (duplicate) {
          throw new AppError(
            'You have already submitted this post link to this campaign. Please submit a different post.',
            400
          );
        }

        // This conditional write serializes submission creation with payout updates
        // on this campaign. If a payout exhausts the budget first, this update fails
        // or the transaction retries and observes the exhausted budget.
        const eligibleCampaign = await Campaign.findOneAndUpdate(
          {
            _id: campaignId,
            status: 'active',
            $expr: { $gt: ['$totalBudget', '$budgetSpent'] },
          },
          { $inc: { submissionCount: 1 } },
          { new: true, session }
        );

        if (!eligibleCampaign) {
          throw new AppError(
            'Cannot submit to this campaign: it is inactive or its budget is exhausted',
            400
          );
        }

        const [createdSubmission] = await Submission.create(
          [{
            creator: req.user!.id,
            campaign: campaignId,
            postLink: normalizedLink,
            views: 0,
            currentPayout: 0,
            isFlagged: false,
            flagReason: null,
            lastViewUpdateAt: new Date(),
            viewVelocity: 0,
          }],
          { session }
        );

        submission = createdSubmission;
      });
    } finally {
      await session.endSession();
    }

    res.status(201).json({
      message: 'Submission created successfully',
      submission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all submissions for authenticated creator with earnings
 * GET /api/submissions/my
 */
export const getMySubmissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const submissions = await Submission.find({ creator: req.user!.id })
      .populate('campaign', 'name platform totalBudget milestones status')
      .sort({ createdAt: -1 });

    const totalEarnings = submissions.reduce(
      (sum, item) => sum + item.currentPayout,
      0
    );

    res.status(200).json({
      submissions,
      totalEarnings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update submission views and recalculate payout atomically (Public / No auth)
 * PATCH /api/submissions/:id/views
 */
export const updateViews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { views } = req.body ?? {};

    // Strict validation: views must be a whole non-negative integer (Item E)
    if (
      views === undefined ||
      typeof views !== 'number' ||
      !Number.isSafeInteger(views) ||
      views < 0
    ) {
      throw new AppError('views must be a non-negative whole integer', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid submission ID format', 400);
    }

    let finalSubmission: any = null;
    let finalCalculatedPayout = 0;
    let finalActualDelta = 0;
    let finalPotentialDelta = 0;
    let finalCapped = false;
    let finalCampaign: any = null;
    const session = await mongoose.startSession();

    try {
      // Both records commit together. MongoDB retries transient transaction conflicts.
      await session.withTransaction(async () => {
        // The driver may rerun this callback, so reset values from prior attempts.
        finalSubmission = null;
        finalCalculatedPayout = 0;
        finalActualDelta = 0;
        finalPotentialDelta = 0;
        finalCapped = false;
        finalCampaign = null;

        const freshSubmission = await Submission.findById(id).session(session);
        if (!freshSubmission) {
          throw new AppError('Submission not found', 404);
        }

        const freshCampaign = await Campaign.findById(freshSubmission.campaign).session(session);
        if (!freshCampaign) {
          throw new AppError('Associated campaign not found', 404);
        }

        const calculatedPayout = calculatePayout(views, freshCampaign.milestones);
        const potentialDelta = calculatedPayout - freshSubmission.currentPayout;
        const remainingBudget = Math.max(0, freshCampaign.totalBudget - freshCampaign.budgetSpent);
        const actualDelta = potentialDelta > 0
          ? Math.min(potentialDelta, remainingBudget)
          : 0;

        // Spike detection (Bonus 2)
        let isFlagged = freshSubmission.isFlagged || false;
        let flagReason = freshSubmission.flagReason || null;
        let viewVelocity = freshSubmission.viewVelocity || 0;
        const now = new Date();
        const lastUpdate = freshSubmission.lastViewUpdateAt || freshSubmission.createdAt;
        const elapsedHours = (now.getTime() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60);
        const deltaViews = views - freshSubmission.views;

        if (deltaViews > 0) {
          const effectiveHours = Math.max(elapsedHours, 1 / 60);
          viewVelocity = Math.round(deltaViews / effectiveHours);

          if (viewVelocity > 50000 || (deltaViews >= 20000 && elapsedHours < 0.1)) {
            isFlagged = true;
            flagReason = `Unusual view spike detected: +${deltaViews.toLocaleString()} views within ${(elapsedHours * 60).toFixed(1)} mins (~${viewVelocity.toLocaleString()} views/hour)`;
          }
        }

        let updatedCampaign: typeof freshCampaign | null = freshCampaign;
        if (actualDelta > 0) {
          updatedCampaign = await Campaign.findOneAndUpdate(
            {
              _id: freshCampaign._id,
              budgetSpent: freshCampaign.budgetSpent,
              $expr: {
                $lte: [{ $add: ['$budgetSpent', actualDelta] }, '$totalBudget'],
              },
            },
            { $inc: { budgetSpent: actualDelta } },
            { new: true, session }
          );

          if (!updatedCampaign) {
            throw new AppError('Campaign budget changed; please retry the update', 409);
          }
        }

        // A failure here aborts the transaction and rolls back the budget increase too.
        const updatedSub = await Submission.findOneAndUpdate(
          {
            _id: id,
            currentPayout: freshSubmission.currentPayout,
          },
          {
            $set: {
              views: Math.max(freshSubmission.views, views),
              currentPayout: freshSubmission.currentPayout + actualDelta,
              lastViewUpdateAt: now,
              viewVelocity,
              isFlagged,
              flagReason,
            },
          },
          { new: true, session }
        );

        if (!updatedSub) {
          throw new AppError('Submission changed; please retry the update', 409);
        }

        finalSubmission = updatedSub;
        finalCalculatedPayout = calculatedPayout;
        finalActualDelta = actualDelta;
        finalPotentialDelta = Math.max(0, potentialDelta);
        finalCapped = potentialDelta > remainingBudget;
        finalCampaign = updatedCampaign;
      });
    } finally {
      await session.endSession();
    }

    if (!finalSubmission) {
      throw new AppError('Could not update views and allocate budget', 409);
    }
    const budgetRemaining = finalCampaign
      ? Math.max(0, finalCampaign.totalBudget - finalCampaign.budgetSpent)
      : 0;

    res.status(200).json({
      message:
        finalActualDelta > 0
          ? 'Views and payout updated successfully'
          : 'Views updated, payout unchanged',
      submission: {
        _id: finalSubmission._id,
        creator: finalSubmission.creator,
        campaign: finalSubmission.campaign,
        postLink: finalSubmission.postLink,
        views: finalSubmission.views,
        currentPayout: finalSubmission.currentPayout,
        isFlagged: finalSubmission.isFlagged,
        flagReason: finalSubmission.flagReason,
        viewVelocity: finalSubmission.viewVelocity,
        createdAt: finalSubmission.createdAt,
        updatedAt: finalSubmission.updatedAt,
      },
      payoutCalculated: finalCalculatedPayout,
      actualDelta: finalActualDelta,
      potentialDelta: Math.max(0, finalPotentialDelta),
      capped: finalCapped,
      campaign: {
        id: finalCampaign?._id,
        totalBudget: finalCampaign?.totalBudget,
        budgetSpent: finalCampaign?.budgetSpent,
        budgetRemaining,
      },
    });
  } catch (error) {
    next(error);
  }
};

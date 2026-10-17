import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IMilestone {
  viewThreshold: number;
  payout: number;
}

export type Platform = 'Instagram' | 'YouTube';
export type CampaignStatus = 'active' | 'completed';

export interface ICampaign extends Document {
  brand: Types.ObjectId;
  name: string;
  platform: Platform;
  totalBudget: number;
  budgetSpent: number;
  submissionCount: number;
  milestones: IMilestone[];
  status: CampaignStatus;
  budgetRemaining: number;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    viewThreshold: {
      type: Number,
      required: [true, 'viewThreshold is required'],
      min: [0, 'viewThreshold cannot be negative'],
    },
    payout: {
      type: Number,
      required: [true, 'payout is required'],
      min: [0, 'payout cannot be negative'],
    },
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>(
  {
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Brand reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    platform: {
      type: String,
      enum: {
        values: ['Instagram', 'YouTube'],
        message: '{VALUE} is not supported. Platform must be Instagram or YouTube',
      },
      required: [true, 'Platform is required'],
    },
    totalBudget: {
      type: Number,
      required: [true, 'totalBudget is required'],
      min: [0, 'totalBudget cannot be negative'],
    },
    budgetSpent: {
      type: Number,
      default: 0,
      min: [0, 'budgetSpent cannot be negative'],
    },
    submissionCount: {
      type: Number,
      default: 0,
      min: [0, 'submissionCount cannot be negative'],
    },
    milestones: {
      type: [milestoneSchema],
      required: [true, 'Milestones are required'],
      validate: {
        validator: function (val: IMilestone[]) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'Campaign must have at least one milestone',
      },
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

campaignSchema.virtual('budgetRemaining').get(function (this: ICampaign) {
  return Math.max(0, this.totalBudget - this.budgetSpent);
});

campaignSchema.pre<ICampaign>('save', function (next) {
  if (this.milestones && this.milestones.length > 0) {
    this.milestones.sort((a, b) => a.viewThreshold - b.viewThreshold);
  }
  next();
});

export const Campaign: Model<ICampaign> = mongoose.model<ICampaign>('Campaign', campaignSchema);
export default Campaign;

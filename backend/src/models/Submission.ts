import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISubmission extends Document {
  creator: Types.ObjectId;
  campaign: Types.ObjectId;
  postLink: string;
  views: number;
  currentPayout: number;
  isFlagged: boolean;
  flagReason?: string | null;
  lastViewUpdateAt: Date;
  viewVelocity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
    },
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Campaign reference is required'],
    },
    postLink: {
      type: String,
      required: [true, 'postLink is required'],
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
      min: [0, 'views cannot be negative'],
    },
    currentPayout: {
      type: Number,
      default: 0,
      min: [0, 'currentPayout cannot be negative'],
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: null,
    },
    lastViewUpdateAt: {
      type: Date,
      default: Date.now,
    },
    viewVelocity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ creator: 1, campaign: 1, postLink: 1 }, { unique: true });

export const Submission: Model<ISubmission> = mongoose.model<ISubmission>(
  'Submission',
  submissionSchema
);
export default Submission;

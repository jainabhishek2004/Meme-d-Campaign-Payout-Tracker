export interface User {
  id: string;
  name: string;
  email: string;
  role: 'brand' | 'creator';
}

export interface Milestone {
  viewThreshold: number;
  payout: number;
}

export interface Campaign {
  _id: string;
  brand: { _id: string; name: string };
  name: string;
  platform: 'Instagram' | 'YouTube';
  totalBudget: number;
  budgetSpent: number;
  milestones: Milestone[];
  status: 'active' | 'completed';
  createdAt: string;
}

export interface Submission {
  _id: string;
  campaign: Campaign;
  postLink: string;
  views: number;
  currentPayout: number;
  isFlagged?: boolean;
  flagReason?: string | null;
  viewVelocity?: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateCampaignInput {
  name: string;
  platform: 'Instagram' | 'YouTube';
  totalBudget: number;
  milestones: Milestone[];
}

export interface SubmissionsResponse {
  submissions: Submission[];
  totalEarnings: number;
}

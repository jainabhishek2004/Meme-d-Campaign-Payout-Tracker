import {
  AuthResponse,
  Campaign,
  CreateCampaignInput,
  Submission,
  SubmissionsResponse,
} from '@/types';
import { getToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${normalizedEndpoint}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error(error.message || 'Unable to connect to the server. Please verify the backend is running.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg =
      data.message ||
      data.error ||
      (Array.isArray(data.errors) ? data.errors.map((e: any) => e.msg || e.message || e).join(', ') : null) ||
      `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

function extractData<T>(res: any): T {
  if (res && typeof res === 'object' && 'data' in res && res.data !== undefined) {
    return res.data as T;
  }
  return res as T;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const parsed = extractData<any>(res);
    return {
      token: parsed.token || res.token,
      user: parsed.user || res.user,
    };
  },

  signup: async (
    name: string,
    email: string,
    password: string,
    role: 'brand' | 'creator'
  ): Promise<AuthResponse> => {
    const res = await request<any>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    const parsed = extractData<any>(res);
    return {
      token: parsed.token || res.token,
      user: parsed.user || res.user,
    };
  },
};

export const campaignApi = {
  create: async (data: CreateCampaignInput): Promise<Campaign> => {
    const res = await request<any>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return extractData<Campaign>(res);
  },

  list: async (): Promise<Campaign[]> => {
    const res = await request<any>('/api/campaigns', {
      method: 'GET',
    });
    const parsed = extractData<any>(res);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.campaigns)) return parsed.campaigns;
    return [];
  },

  getMy: async (): Promise<Campaign[]> => {
    const res = await request<any>('/api/campaigns/my', {
      method: 'GET',
    });
    const parsed = extractData<any>(res);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.campaigns)) return parsed.campaigns;
    return [];
  },

  getById: async (id: string): Promise<Campaign> => {
    const res = await request<any>(`/api/campaigns/${id}`, {
      method: 'GET',
    });
    return extractData<Campaign>(res);
  },
};

export const submissionApi = {
  submit: async (campaignId: string, postLink: string): Promise<Submission> => {
    const res = await request<any>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify({
        campaignId,
        campaign: campaignId,
        postLink,
      }),
    });
    return extractData<Submission>(res);
  },

  getMy: async (): Promise<SubmissionsResponse> => {
    const res = await request<any>('/api/submissions/my', {
      method: 'GET',
    });
    const parsed = extractData<any>(res);

    if (Array.isArray(parsed)) {
      const totalEarnings = parsed.reduce(
        (sum: number, item: Submission) => sum + (Number(item.currentPayout) || 0),
        0
      );
      return { submissions: parsed, totalEarnings };
    }

    if (parsed && typeof parsed === 'object') {
      const submissions = Array.isArray(parsed.submissions)
        ? parsed.submissions
        : Array.isArray(parsed.data)
        ? parsed.data
        : [];
      const totalEarnings =
        typeof parsed.totalEarnings === 'number'
          ? parsed.totalEarnings
          : submissions.reduce(
              (sum: number, item: Submission) => sum + (Number(item.currentPayout) || 0),
              0
            );
      return { submissions, totalEarnings };
    }

    return { submissions: [], totalEarnings: 0 };
  },

  updateViews: async (id: string, views: number): Promise<Submission> => {
    const res = await request<any>(`/api/submissions/${id}/views`, {
      method: 'PATCH',
      body: JSON.stringify({ views }),
    });
    return extractData<Submission>(res);
  },
};

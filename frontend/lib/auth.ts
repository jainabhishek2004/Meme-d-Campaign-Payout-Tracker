import { User } from '@/types';

const TOKEN_KEY = 'memed_token';
const USER_KEY = 'memed_user';

export const isBrowser = (): boolean => typeof window !== 'undefined';

export const getToken = (): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, token);
  // Set cookie for Next.js middleware (7 days expiry)
  document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
};

export const getUser = (): User | null => {
  if (!isBrowser()) return null;
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    const raw = JSON.parse(userJson);
    return {
      id: raw.id || raw._id || '',
      name: raw.name || '',
      email: raw.email || '',
      role: raw.role || 'creator',
    };
  } catch {
    return null;
  }
};

export const setUser = (user: User): void => {
  if (!isBrowser()) return;
  const normalizedUser: User = {
    id: user.id || (user as unknown as { _id?: string })._id || '',
    name: user.name,
    email: user.email,
    role: user.role,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  // Set role cookie for middleware routing if needed
  document.cookie = `role=${normalizedUser.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const logout = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'role=; path=/; max-age=0; SameSite=Lax';
  window.location.href = '/login';
};

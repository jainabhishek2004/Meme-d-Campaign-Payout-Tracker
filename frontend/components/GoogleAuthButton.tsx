'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';

type GoogleCredentialResponse = { credential?: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (element: HTMLElement, options: Record<string, string>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

interface GoogleAuthButtonProps {
  role?: 'brand' | 'creator';
  onError: (message: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleAuthButton({
  role,
  onError,
  onLoadingChange,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [configured, setConfigured] = useState(Boolean(GOOGLE_CLIENT_ID));
  const [pendingCredential, setPendingCredential] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'brand' | 'creator'>('creator');
  const [submitting, setSubmitting] = useState(false);

  const submitCredential = useCallback(async (credential: string, selectedRoleOverride?: 'brand' | 'creator') => {
    onError(null);
    onLoadingChange(true);
    setSubmitting(true);
    try {
      const response = await authApi.googleSignIn(credential, selectedRoleOverride || role);
      if ('requiresRole' in response) {
        setPendingCredential(credential);
        return;
      }
      if (!response.token || !response.user) {
        throw new Error('Invalid response received from server.');
      }
      setToken(response.token);
      setUser(response.user);
      router.push(response.user.role === 'brand' ? '/dashboard/brand' : '/dashboard/creator');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
      onLoadingChange(false);
    }
  }, [onError, onLoadingChange, role, router]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;
    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          if (!credential) {
            onError('Google did not return an account credential. Please try again.');
            return;
          }
          await submitCredential(credential);
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rect',
        text: 'continue_with',
        width: String(Math.min(400, buttonRef.current.clientWidth || 320)),
      });
    };

    if (window.google) {
      renderGoogleButton();
      return () => { cancelled = true; };
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderGoogleButton);
    script.addEventListener('error', () => setConfigured(false), { once: true });

    return () => {
      cancelled = true;
      script?.removeEventListener('load', renderGoogleButton);
    };
  }, [onError, onLoadingChange, submitCredential]);

  if (!configured) {
    return (
      <p className="mt-4 text-center text-xs text-[#777773]">
        Google sign-in is not configured yet.
      </p>
    );
  }

  return (
    <>
      <div className="google-button-shell">
      <div className="mt-3 flex min-h-11 w-full justify-center overflow-hidden rounded-lg" aria-label="Continue with Google">
        <div ref={buttonRef} className="w-full" />
      </div>
      </div>
      {pendingCredential && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingCredential(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="google-new-account-title" className="modal-panel">
          <div className="mb-6"><p className="eyebrow">Google account verified</p><h2 id="google-new-account-title" className="mt-2 text-2xl font-medium tracking-[-.045em]">You’re new to Meme’d</h2><p className="mt-2 text-sm leading-6 text-[#777773]">There isn’t an account for this Google address yet. Choose how you’d like to use Meme’d to finish signing up.</p></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(['creator', 'brand'] as const).map((accountRole) => <button key={accountRole} type="button" aria-pressed={selectedRole === accountRole} onClick={() => setSelectedRole(accountRole)} className="auth-choice"><span className="block text-sm font-medium capitalize">{accountRole}</span><span className="mt-1 block text-xs text-[#777773]">{accountRole === 'creator' ? 'Share posts and earn from views' : 'Create and manage campaigns'}</span></button>)}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPendingCredential(null)} className="btn btn-secondary" disabled={submitting}>Cancel</button><button type="button" onClick={() => void submitCredential(pendingCredential, selectedRole)} disabled={submitting} className="btn btn-primary">{submitting ? 'Creating account…' : `Create ${selectedRole} account`} <span aria-hidden="true">↗</span></button></div>
        </section>
      </div>}
    </>
  );
}

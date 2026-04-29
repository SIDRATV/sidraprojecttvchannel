'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * /ref/[code] — Referral landing page.
 * Stores the code in localStorage then immediately redirects to signup.
 * This page also increments the click counter via the API.
 */
export default function RefPage() {
  const params = useParams();
  const router = useRouter();
  const code = typeof params?.code === 'string' ? params.code : Array.isArray(params?.code) ? params.code[0] : '';

  useEffect(() => {
    if (!code) {
      router.replace('/signup');
      return;
    }
    // Save code for signup form to pick up
    localStorage.setItem('referral_code', code.toLowerCase());

    // Fire-and-forget: increment click counter
    fetch('/api/referral/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toLowerCase() }),
    }).catch(() => {});

    // Redirect immediately
    router.replace(`/signup?ref=${encodeURIComponent(code.toLowerCase())}`);
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Redirection...</p>
      </div>
    </div>
  );
}

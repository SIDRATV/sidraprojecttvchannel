'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TryPremiumPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/subscribe');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

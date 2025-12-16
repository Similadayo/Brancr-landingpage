'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NegotiationSettingsPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect away since negotiation settings have been removed
    router.replace('/app/settings');
  }, [router]);
  return null;
}

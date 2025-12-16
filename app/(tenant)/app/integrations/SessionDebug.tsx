'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export default function SessionDebug({ userData }: { userData: unknown }) {
  const [show, setShow] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URL(window.location.href).searchParams;
    if (process.env.NODE_ENV !== 'production' || params.get('debug') === '1') {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <details className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
      <summary className="cursor-pointer font-semibold">Session debug</summary>
      <div className="mt-2">
        <pre className="max-h-48 overflow-auto text-[11px]">{JSON.stringify(userData || null, null, 2)}</pre>
        <div className="mt-2">
          <button
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
              toast.success('Refetching session...');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
          >
            Refresh session
          </button>
        </div>
      </div>
    </details>
  );
}

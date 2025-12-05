'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api';
import { CopyToClipboard } from './CopyToClipboard';
import { LinkIcon, XIcon, CheckCircleIcon } from './icons';
import { toast } from 'react-hot-toast';

type PortalLinkGeneratorProps = {
  orderId: number;
  onTokenGenerated?: (url: string) => void;
};

export function PortalLinkGenerator({ orderId, onTokenGenerated }: PortalLinkGeneratorProps) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: tokenData, isLoading } = useQuery({
    queryKey: ['portal-token', orderId],
    queryFn: () => tenantApi.generatePortalToken(orderId),
    enabled: false, // Don't auto-fetch, only on button click
    retry: false,
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await queryClient.fetchQuery({
        queryKey: ['portal-token', orderId],
        queryFn: () => tenantApi.generatePortalToken(orderId),
      });
      const data = queryClient.getQueryData(['portal-token', orderId]) as any;
      if (data?.portal_url) {
        toast.success('Portal link generated successfully');
        onTokenGenerated?.(data.portal_url);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate portal link');
    } finally {
      setIsGenerating(false);
    }
  };

  const portalUrl = tokenData?.portal_url;
  const expiresAt = tokenData?.expires_at;

  const shareViaEmail = (email?: string) => {
    if (!portalUrl) return;
    const subject = encodeURIComponent('Your Order Details');
    const body = encodeURIComponent(`View your order details: ${portalUrl}`);
    window.location.href = `mailto:${email || ''}?subject=${subject}&body=${body}`;
  };

  const shareViaWhatsApp = () => {
    if (!portalUrl) return;
    const text = encodeURIComponent(`View your order details: ${portalUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Customer Portal Link</h2>
        <LinkIcon className="h-5 w-5 text-gray-400" />
      </div>

      {!portalUrl ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate a secure link that customers can use to view their order details without logging in.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isGenerating || isLoading ? 'Generating...' : 'Generate Portal Link'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Portal URL</p>
            <CopyToClipboard text={portalUrl} showLabel={false} />
            {expiresAt && (
              <p className="mt-2 text-xs text-gray-500">
                Expires: {new Date(expiresAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(portalUrl);
                toast.success('Link copied to clipboard!');
              }}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Copy Link
            </button>
            <button
              onClick={() => shareViaEmail()}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Email
            </button>
            <button
              onClick={shareViaWhatsApp}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              WhatsApp
            </button>
          </div>

          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-800">
              💡 Share this link with your customer so they can view their order details and download receipts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


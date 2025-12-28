'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { tenantApi } from "@/lib/api";
import { XIcon, ArrowUpTrayIcon } from "@/app/(tenant)/components/icons";
import Link from "next/link";

function CustomerPortalReceiptPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [receiptContent, setReceiptContent] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token is required");
      setIsLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      try {
        const response = await fetch(`/api/portal/receipt?token=${token}`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 404) {
            setError("Invalid or expired link");
          } else {
            setError("Failed to load receipt");
          }
          setIsLoading(false);
          return;
        }

        const contentType = response.headers.get("content-type");
        
        if (contentType?.includes("text/html")) {
          const html = await response.text();
          setReceiptContent(html);
        } else if (contentType?.includes("application/pdf") || contentType?.includes("application/octet-stream")) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setReceiptUrl(url);
        } else {
          // Try to get URL from response
          const data = await response.json();
          if (data.receipt_url) {
            setReceiptUrl(data.receipt_url);
          } else {
            setError("Receipt format not supported");
          }
        }
      } catch (err) {
        console.error("Receipt fetch error:", err);
        setError("Failed to load receipt");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipt();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (receiptUrl) {
      const link = document.createElement("a");
      link.href = receiptUrl;
      link.download = "receipt.pdf";
      link.click();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl">
          <XIcon className="mx-auto h-12 w-12 text-rose-400" />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Receipt Not Available</h1>
          <p className="mt-3 text-sm text-gray-600">
            {error || "This link is invalid or has expired. Please contact the business for a new link."}
          </p>
          {token && (
            <Link
              href={`/portal/order?token=${token}`}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Back to Order
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href={`/portal/order?token=${token}`}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Order
          </Link>
          <div className="flex items-center gap-2">
            {receiptUrl && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                Download
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary/90 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
            >
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {receiptContent ? (
          <div
            className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none"
            dangerouslySetInnerHTML={{ __html: receiptContent }}
          />
        ) : receiptUrl ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <iframe
              src={receiptUrl}
              className="h-[800px] w-full rounded-lg"
              title="Receipt PDF"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">Receipt content not available</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function CustomerPortalReceiptPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    }>
      <CustomerPortalReceiptPageContent />
    </Suspense>
  );
}


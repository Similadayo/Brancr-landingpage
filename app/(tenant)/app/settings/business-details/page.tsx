'use client';

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantApi, ApiError } from "@/lib/api";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { BusinessDetailsStep } from "@/app/(tenant)/components/onboarding/BusinessDetailsStep";

type MenuItem = {
  id?: number;
  name: string;
  category: string;
  price: string;
  description: string;
};

type FAQ = {
  id?: number;
  question: string;
  answer: string;
};

export default function BusinessDetailsSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: () => tenantApi.onboardingStatus(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get business details from response
  const businessDetails = data?.business_details;
  const initialData = businessDetails
    ? {
      menu_items: businessDetails.menu_items || [],
      faqs: businessDetails.faqs || [],
      keywords: businessDetails.keywords || "",
      knowledge_base: businessDetails.knowledge_base || "",
    }
    : undefined;

  const handleComplete = async (
    step: 'business_details',
    data: {
      menu_items?: MenuItem[];
      faqs?: FAQ[];
      keywords?: string;
      knowledge_base?: string;
    }
  ) => {
    setIsSubmitting(true);
    try {
      // Use the settings endpoint for updates
      await tenantApi.updateBusinessDetails({
        menu_items: data.menu_items?.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
        })),
        faqs: data.faqs?.map((faq) => ({
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
        })),
        keywords: data.keywords,
        knowledge_base: data.knowledge_base,
      });

      toast.success("Business details updated");
      void queryClient.invalidateQueries({ queryKey: ["onboarding", "status"] });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update business details");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[80px] lg:left-[276px] flex flex-col bg-gray-50 dark:bg-dark-bg">
      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Business Details</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage menu items, FAQs, keywords, and knowledge base for your business.
              </p>
            </div>
            <Link
              href="/app/settings/onboarding"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
            >
              ← Back to Summary
            </Link>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <BusinessDetailsStep
                onComplete={handleComplete}
                isSubmitting={isSubmitting}
                initialData={initialData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";
import {
  BuildingOfficeIcon,
  SparklesIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckCircleIcon,
} from "../../../components/icons";

export default function OnboardingSummaryPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tenant", "onboarding", "status"],
    queryFn: tenantApi.onboardingStatus,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Failed to load onboarding summary.</p>
        <button
          onClick={() => refetch()}
          className="mt-3 inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow hover:bg-red-100"
        >
          Try again
        </button>
      </div>
    );
  }

  const profile = data?.business_profile ?? {};
  const persona = data?.persona ?? {};
  const details = data?.business_details ?? {};

  return (
    <div className="space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10">
            <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">Onboarding Summary</h1>
            <p className="mt-1 text-xs text-gray-600 sm:text-sm">
              Review what you set up during onboarding. You can edit each section below.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Business Profile Card */}
        <section className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-primary/5 transition-transform group-hover:scale-150 sm:h-24 sm:w-24 sm:-translate-y-8 sm:translate-x-8" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 sm:h-12 sm:w-12">
                <BuildingOfficeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Business Profile</h2>
                <p className="mt-0.5 text-xs text-gray-500">Company information</p>
              </div>
            </div>
            <Link
              href="/app/settings/business"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary sm:w-auto sm:justify-start"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit
            </Link>
          </div>
          <dl className="relative mt-4 space-y-3 sm:mt-6 sm:space-y-3.5">
            <Row label="Name" value={(profile as any).name} />
            <Row label="Industry" value={(profile as any).industry} />
            <Row label="Description" value={(profile as any).description} />
            <Row label="Location" value={(profile as any).location} />
            <Row label="Website" value={(profile as any).website} />
            <Row label="Operating Hours" value={(profile as any).operating_hours} />
          </dl>
        </section>

        {/* AI Persona Card */}
        <section className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:p-6">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full bg-primary/5 transition-transform group-hover:scale-150 sm:h-24 sm:w-24 sm:-translate-y-8 sm:translate-x-8" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 sm:h-12 sm:w-12">
                <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">AI Persona</h2>
                <p className="mt-0.5 text-xs text-gray-500">Bot personality & tone</p>
              </div>
            </div>
            <Link
              href="/app/settings/persona"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary sm:w-auto sm:justify-start"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit
            </Link>
          </div>
          <dl className="relative mt-4 space-y-3 sm:mt-6 sm:space-y-3.5">
            <Row label="Bot Name" value={(persona as any).bot_name} />
            <Row label="Tone" value={(persona as any).tone} />
            <Row label="Language" value={(persona as any).language} />
            <Row 
              label="Include Humor" 
              value={(persona as any).humor ? (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  Yes
                </span>
              ) : (
                <span className="text-gray-400">No</span>
              )} 
            />
            <Row label="Style Notes" value={(persona as any).style_notes} />
          </dl>
        </section>

        {/* Business Details Card */}
        <section className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:p-6 md:col-span-2">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-primary/5 transition-transform group-hover:scale-150 sm:h-32 sm:w-32 sm:-translate-y-12 sm:translate-x-12" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600 sm:h-12 sm:w-12">
                <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Business Details</h2>
                <p className="mt-0.5 text-xs text-gray-500">Menu items, FAQs, and knowledge base</p>
              </div>
            </div>
            <Link
              href="/app/settings/business-details"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary sm:w-auto sm:justify-start"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit
            </Link>
          </div>
          <div className="relative mt-4 grid gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2">

            <DetailSection
              title="FAQs"
              items={Array.isArray((details as any).faqs) && (details as any).faqs.length > 0
                ? (details as any).faqs.map((f: any) => 
                    f?.question ? `${f.question}${f.answer ? ` – ${f.answer}` : ""}` : null
                  ).filter(Boolean)
                : null}
            />
            <div className="space-y-4">
              <DetailSection
                title="Keywords"
                value={(details as any).keywords}
              />
              <DetailSection
                title="Knowledge Base"
                value={(details as any).knowledge_base}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-full shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:w-32">
        {label}
      </dt>
      <dd className="flex-1 text-sm font-medium text-gray-900 sm:text-sm">
        {value || <span className="text-gray-400">—</span>}
      </dd>
    </div>
  );
}

function DetailSection({ 
  title, 
  items, 
  value 
}: { 
  title: string; 
  items?: (string | null)[] | null; 
  value?: string;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      {items ? (
        <ul className="mt-3 space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      ) : value ? (
        <p className="mt-3 text-sm font-medium text-gray-900">{value}</p>
      ) : (
        <p className="mt-3 text-sm text-gray-400">—</p>
      )}
    </div>
  );
}



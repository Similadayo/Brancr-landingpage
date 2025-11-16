/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";

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
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Settings</p>
          <h1 className="text-2xl font-semibold text-gray-900">Onboarding Summary</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review what you set up during onboarding. You can edit each section below.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Business Profile</h2>
            <Link
              href="/app/settings/business"
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary"
            >
              Edit
            </Link>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Name" value={profile.name} />
            <Row label="Industry" value={profile.industry} />
            <Row label="Description" value={profile.description} />
            <Row label="Location" value={profile.location} />
            <Row label="Website" value={profile.website} />
            <Row label="Operating hours" value={profile.operating_hours} />
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">AI Persona</h2>
            <Link
              href="/app/settings/persona"
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary"
            >
              Edit
            </Link>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Bot name" value={(persona as any).bot_name} />
            <Row label="Tone" value={persona.tone} />
            <Row label="Language" value={persona.language} />
            <Row label="Include humor" value={(persona as any).humor ? "Yes" : "No"} />
            <Row label="Style notes" value={(persona as any).style_notes} />
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
            <Link
              href="/app/settings/business"
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary"
            >
              Edit
            </Link>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Menu</p>
              {Array.isArray((details as any).menu_items) && (details as any).menu_items.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                  {(details as any).menu_items.map((m: any, i: number) => (
                    <li key={i}>{m?.name ? `${m.name}${m.price ? ` – ${m.price}` : ""}` : "-"}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-500">—</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">FAQs</p>
              {Array.isArray((details as any).faqs) && (details as any).faqs.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                  {(details as any).faqs.map((f: any, i: number) => (
                    <li key={i}>
                      {f?.question ? `${f.question}${f.answer ? ` – ${f.answer}` : ""}` : "-"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-500">—</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Keywords</p>
              <p className="mt-2 text-sm text-gray-700">{(details as any).keywords || "—"}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-gray-400">Knowledge base</p>
              <p className="mt-2 text-sm text-gray-700">{(details as any).knowledge_base || "—"}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="w-40 shrink-0 text-xs uppercase tracking-[0.3em] text-gray-400">{label}</dt>
      <dd className="flex-1 text-sm text-gray-700">{value || "—"}</dd>
    </div>
  );
}



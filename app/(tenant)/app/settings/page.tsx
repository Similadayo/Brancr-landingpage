'use client';

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import {
  useBilling,
  useTeamMembers,
  useUsage,
} from "../../hooks/useSettingsData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi, ApiError } from "@/lib/api";
import { toast } from "react-hot-toast";

type TabKey = "profile" | "notifications" | "team" | "billing";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "profile", label: "Business profile" },
  { key: "notifications", label: "Notifications" },
  { key: "team", label: "Team" },
  { key: "billing", label: "Billing & plan" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const queryClient = useQueryClient();

  const teamQuery = useTeamMembers();
  const billingQuery = useBilling();
  const usageQuery = useUsage();
  
  // Fetch business profile data
  const { data: onboardingData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: () => tenantApi.onboardingStatus(),
  });

  const businessProfile = onboardingData?.business_profile;
  
  // Form state for business profile
  const [profileForm, setProfileForm] = useState({
    name: "",
    industry: "",
    description: "",
    location: "",
    website: "",
    operating_hours: "",
  });

  // Update form when data loads
  useEffect(() => {
    if (businessProfile) {
      setProfileForm({
        name: businessProfile.name || "",
        industry: businessProfile.industry || "",
        description: businessProfile.description || "",
        location: businessProfile.location || "",
        website: businessProfile.website || "",
        operating_hours: businessProfile.operating_hours || "",
      });
    }
  }, [businessProfile]);

  // Update business profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: () => tenantApi.onboardingBusinessProfile({
      name: profileForm.name,
      industry: profileForm.industry,
      description: profileForm.description,
      location: profileForm.location,
      website: profileForm.website || undefined,
      operating_hours: profileForm.operating_hours || undefined,
    }),
    onSuccess: () => {
      toast.success("Business profile updated");
      void queryClient.invalidateQueries({ queryKey: ["onboarding", "status"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to update profile");
    },
  });

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "profile":
        return (
          <form 
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              updateProfileMutation.mutate();
            }}
          >
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="business-name">
                    Business name
                  </label>
                  <input
                    id="business-name"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Your company name"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="industry">
                      Industry
                    </label>
                    <input
                      id="industry"
                      type="text"
                      value={profileForm.industry}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, industry: e.target.value }))}
                      placeholder="Retail, Restaurant, Services..."
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700" htmlFor="location">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="website">
                    Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="operating-hours">
                    Operating hours
                  </label>
                  <input
                    id="operating-hours"
                    type="text"
                    value={profileForm.operating_hours}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, operating_hours: e.target.value }))}
                    placeholder="Mon-Fri 9am-5pm, Sat 10am-2pm"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={profileForm.description}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    placeholder="Tell us about your business..."
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </>
            )}
          </form>
        );
      case "notifications":
        return (
          <form className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Channel alerts</h3>
              <div className="mt-3 space-y-3 text-sm text-gray-600">
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" /> WhatsApp connection events
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" /> Campaign send status
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" /> Template approvals
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Escalation channels</h3>
              <div className="mt-3 space-y-3 text-sm text-gray-600">
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" /> Email: contact@brancr.com
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" /> Slack: #support-escalations
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" /> Telegram bot ping
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90">
                Save preferences
              </button>
            </div>
          </form>
        );
      case "team":
        return (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary hover:text-primary">
                Invite teammate
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              {teamQuery.isLoading ? (
                <div className="space-y-2 p-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="h-3 w-32 rounded-full bg-gray-200" />
                      <div className="mt-2 h-3 w-48 rounded-full bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : teamQuery.data && teamQuery.data.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {teamQuery.data.map((member) => (
                      <tr key={member.id}>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">{member.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{member.email}</td>
                        <td className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">{member.role}</td>
                        <td className="px-4 py-4 text-right text-xs font-semibold text-primary">
                          <button className="hover:text-primary/80">Edit role</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No teammates yet. Invite your first collaborator.
                </div>
              )}
            </div>
          </div>
        );
      case "billing":
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Current plan</h3>
              {billingQuery.isLoading ? (
                <div className="mt-2 h-20 animate-pulse rounded-xl bg-gray-50" />
              ) : billingQuery.data ? (
                <>
                  <p className="mt-2 text-xs text-gray-500">
                    {billingQuery.data.plan}{" "}
                    {billingQuery.data.trialDaysRemaining
                      ? `• ${billingQuery.data.trialDaysRemaining} days remaining`
                      : null}
                  </p>
                  <p className="mt-4 text-4xl font-semibold text-gray-900">
                    {billingQuery.data.currency} {billingQuery.data.amount}
                  </p>
                  <p className="text-xs text-gray-500">
                    per {billingQuery.data.cadence === "annual" ? "year" : "month"}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-gray-500">Plan details unavailable.</p>
              )}
              <div className="mt-4 space-y-2 text-xs text-gray-600">
                <p>• 5,000 monthly conversations</p>
                <p>• AI assisted replies</p>
                <p>• WhatsApp, Instagram, Facebook integrations</p>
              </div>
              <button className="mt-6 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90">
                Upgrade plan
              </button>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Usage</h3>
              <p className="mt-2 text-xs text-gray-500">Monitor limits for conversations, templates, and seats.</p>
              <div className="mt-6 space-y-4 text-xs text-gray-600">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Conversations</span>
                    <span>
                      {usageQuery.data?.conversations.used ?? "--"} / {usageQuery.data?.conversations.limit ?? "--"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: usageQuery.data
                          ? `${Math.min(
                              100,
                              (usageQuery.data.conversations.used / usageQuery.data.conversations.limit) * 100
                            )}%`
                          : "0%",
                      }}
                      aria-hidden
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Active seats</span>
                    <span>
                      {usageQuery.data?.seats.used ?? "--"} / {usageQuery.data?.seats.limit ?? "--"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: usageQuery.data
                          ? `${Math.min(100, (usageQuery.data.seats.used / usageQuery.data.seats.limit) * 100)}%`
                          : "0%",
                      }}
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [
    activeTab,
    billingQuery.data,
    billingQuery.isLoading,
    teamQuery.data,
    teamQuery.isLoading,
    usageQuery.data,
    isLoadingProfile,
    profileForm,
    updateProfileMutation,
  ]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Workspace settings</h1>
        <p className="text-sm text-gray-600">
          Manage your profile, channels, billing, notifications, and developer integrations in one place.
        </p>
      </header>

      <div className="rounded-3xl border border-gray-200 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "border-primary bg-primary text-white shadow shadow-primary/20"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm shadow-primary/5">{renderTabContent}</section>
    </div>
  );
}


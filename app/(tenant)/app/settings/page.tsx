'use client';

import { useMemo, useState, useEffect } from "react";
import {
  useBilling,
  useTeamMembers,
  useUsage,
} from "../../hooks/useSettingsData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi, ApiError } from "@/lib/api";
import { toast } from "react-hot-toast";
import { getUserFriendlyErrorMessage } from "@/lib/error-messages";
import {
  SettingsIcon,
  UserIcon,
  BellIcon,
  UsersIcon,
  CreditCardIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  SparklesIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
} from "../../components/icons";
import PersonaSummary from './persona/PersonaSummary';
import { IndustrySelector } from "../../components/IndustrySelector";
import { useTenantIndustry } from "../../hooks/useIndustry";

type TabKey = "profile" | "industry" | "notifications" | "team" | "billing";

const TABS: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "profile", label: "Business Profile", icon: <UserIcon className="w-4 h-4" /> },
  { key: "industry", label: "Industry", icon: <BuildingOfficeIcon className="w-4 h-4" /> },
  { key: "notifications", label: "Notifications", icon: <BellIcon className="w-4 h-4" /> },
  { key: "team", label: "Team", icon: <UsersIcon className="w-4 h-4" /> },
  { key: "billing", label: "Billing & Plan", icon: <CreditCardIcon className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const queryClient = useQueryClient();

  const teamQuery = useTeamMembers();
  const billingQuery = useBilling();
  const usageQuery = useUsage();
  const { data: tenantIndustry } = useTenantIndustry();
  
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
                  <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="business-name">
                    Business Name
                  </label>
                  <input
                    id="business-name"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Your company name"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="industry">
                      Industry
                    </label>
                    <input
                      id="industry"
                      type="text"
                      value={profileForm.industry}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, industry: e.target.value }))}
                      placeholder="Retail, Restaurant, Services..."
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="location">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="website">
                    Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="operating-hours">
                    Operating Hours
                  </label>
                  <input
                    id="operating-hours"
                    type="text"
                    value={profileForm.operating_hours}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, operating_hours: e.target.value }))}
                    placeholder="Mon-Fri 9am-5pm, Sat 10am-2pm"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={profileForm.description}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    placeholder="Tell us about your business..."
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        );
      case "industry":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Industry</h3>
              {tenantIndustry ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-gray-900">{tenantIndustry.industry_name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tenantIndustry.capabilities.has_products && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            Products
                          </span>
                        )}
                        {tenantIndustry.capabilities.has_menu && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Menu Items
                          </span>
                        )}
                        {tenantIndustry.capabilities.has_services && (
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                            Services
                          </span>
                        )}
                      </div>
                    </div>
                    <CheckCircleIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
                  <p className="text-sm text-gray-600">No industry selected yet.</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Industry</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select a different industry to change your workspace capabilities. This will update which sections (Products, Menu Items, Services) are available in your navigation.
              </p>
              <IndustrySelector
                showDescription={true}
                allowChange={true}
                onSelect={(industryId) => {
                  // Industry updated - invalidate all related queries to refresh UI
                  void queryClient.invalidateQueries({ queryKey: ["tenant-industry"] });
                  // Navigation will automatically update based on new capabilities
                  toast.success("Industry updated successfully. Navigation will refresh automatically.");
                }}
              />
            </div>
          </div>
        );
      case "notifications":
        return (
          <form className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BellIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900">Channel Alerts</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" />
                  <span className="text-sm text-gray-700">WhatsApp connection events</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" />
                  <span className="text-sm text-gray-700">Campaign send status</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" />
                  <span className="text-sm text-gray-700">Template approvals</span>
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900">Escalation Channels</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" />
                  <span className="text-sm text-gray-700">Email: contact@brancr.com</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" />
                  <span className="text-sm text-gray-700">Slack: #support-escalations</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40" />
                  <span className="text-sm text-gray-700">Telegram bot ping</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90">
                <CheckCircleIcon className="h-4 w-4" />
                Save Preferences
              </button>
            </div>
          </form>
        );
      case "team":
        return (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary">
                <PlusIcon className="h-4 w-4" />
                Invite Teammate
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {teamQuery.isLoading ? (
                <div className="space-y-2 p-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <div className="h-3 w-32 rounded-full bg-gray-200" />
                      <div className="mt-2 h-3 w-48 rounded-full bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : teamQuery.data && teamQuery.data.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Role</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {teamQuery.data.map((member) => (
                      <tr key={member.id} className="transition hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">{member.name}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{member.email}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:text-primary/80">
                            <PencilIcon className="h-3.5 w-3.5" />
                            Edit Role
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-3 text-sm font-semibold text-gray-900">No teammates yet</p>
                  <p className="mt-1 text-xs text-gray-500">Invite your first collaborator to get started</p>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90">
                    <PlusIcon className="h-4 w-4" />
                    Invite Teammate
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case "billing":
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCardIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900">Current Plan</h3>
              </div>
              {billingQuery.isLoading ? (
                <div className="mt-2 h-20 animate-pulse rounded-lg bg-gray-50" />
              ) : billingQuery.data ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {billingQuery.data.plan}
                    {billingQuery.data.trialDaysRemaining
                      ? ` • ${billingQuery.data.trialDaysRemaining} days remaining`
                      : null}
                  </p>
                  <p className="mt-4 text-4xl font-bold text-gray-900">
                    {billingQuery.data.currency} {billingQuery.data.amount}
                  </p>
                  <p className="text-xs text-gray-500">
                    per {billingQuery.data.cadence === "annual" ? "year" : "month"}
                  </p>
                  <div className="mt-6 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span>5,000 monthly conversations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span>AI assisted replies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span>WhatsApp, Instagram, Facebook integrations</span>
                    </div>
                  </div>
                  <button className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90">
                    Upgrade Plan
                  </button>
                </>
              ) : (
                <p className="mt-2 text-xs text-gray-500">Plan details unavailable.</p>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900">Usage</h3>
              </div>
              <p className="mb-6 text-xs text-gray-500">Monitor limits for conversations, templates, and seats.</p>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">Conversations</span>
                    <span className="text-sm text-gray-600">
                      {usageQuery.data?.conversations.used ?? "--"} / {usageQuery.data?.conversations.limit ?? "--"}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100">
                    <div
                      className="h-2.5 rounded-full bg-primary transition-all"
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">Active Seats</span>
                    <span className="text-sm text-gray-600">
                      {usageQuery.data?.seats.used ?? "--"} / {usageQuery.data?.seats.limit ?? "--"}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100">
                    <div
                      className="h-2.5 rounded-full bg-primary transition-all"
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
    tenantIndustry,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Workspace Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your profile, channels, billing, notifications, and team
            </p>
          </div>
        </div>
      </header>

      {/* Quick Summary */}
      <div className="mt-4 md:mt-6">
        <PersonaSummary />
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "border-primary bg-primary text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {renderTabContent}
      </section>
    </div>
  );
}

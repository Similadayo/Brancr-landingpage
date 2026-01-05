'use client';

import { useMemo, useState, useEffect } from "react";
import {
  useBilling,
  useTeamMembers,
  useUsage,
  useEscalationSettings,
  useUpdateEscalationSettings,
} from "../../hooks/useSettingsData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi, authApi, ApiError } from "@/lib/api";
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
  WhatsAppIcon,

  LockClosedIcon,
  LinkIcon,
} from "../../components/icons";
import PersonaSummary from './persona/PersonaSummary';
import { IndustrySelector } from "../../components/IndustrySelector";
import { useTenantIndustry } from "../../hooks/useIndustry";
import { WhatsAppProfile } from "../../components/WhatsAppProfile";
import { useIntegrations } from "../../hooks/useIntegrations";
import TelegramConnectButton from "../../components/TelegramConnectButton";

type TabKey = "profile" | "industry" | "notifications" | "team" | "billing" | "whatsapp" | "integrations" | "ai_behavior" | "security";

const TABS: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "profile", label: "Business Profile", icon: <UserIcon className="w-4 h-4" /> },
  { key: "industry", label: "Industry", icon: <BuildingOfficeIcon className="w-4 h-4" /> },
  { key: "notifications", label: "Notifications", icon: <BellIcon className="w-4 h-4" /> },
  { key: "integrations", label: "Integrations", icon: <LinkIcon className="w-4 h-4" /> },
  { key: "ai_behavior", label: "AI Behavior", icon: <SparklesIcon className="w-4 h-4" /> },
  { key: "team", label: "Team", icon: <UsersIcon className="w-4 h-4" /> },
  { key: "billing", label: "Billing & Plan", icon: <CreditCardIcon className="w-4 h-4" /> },
  { key: "whatsapp", label: "WhatsApp Profile", icon: <WhatsAppIcon className="w-4 h-4" /> },
  { key: "security", label: "Security", icon: <LockClosedIcon className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const queryClient = useQueryClient();

  const teamQuery = useTeamMembers();
  const billingQuery = useBilling();
  const usageQuery = useUsage();
  const escalationSettingsQuery = useEscalationSettings();
  const updateEscalationMutation = useUpdateEscalationSettings();

  const { data: tenantIndustry } = useTenantIndustry();
  const { data: integrations } = useIntegrations();

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

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: typeof passwordForm) => authApi.changePassword({
      current_password: data.currentPassword,
      new_password: data.newPassword,
    }),
    onSuccess: () => {
      toast.success("Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to update password");
    },
  });

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "integrations":
        const telegram = integrations?.find(i => i.platform === 'telegram');

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Platforms</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {telegram && telegram.connected ? (
                <div className="flex items-center justify-between p-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex-shrink-0 bg-[#0088cc]/10 rounded-full flex items-center justify-center text-[#0088cc]">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                    </div>
                    <div>
                      <strong className="block text-gray-900 dark:text-white">Telegram</strong>
                      <p className="text-sm text-gray-500">Connected</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    Connected ✅
                  </span>
                </div>
              ) : (
                <TelegramConnectButton variant="card" />
              )}
            </div>
          </div>
        );
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
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
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
                  // Invalidate industry-related data to show existing items for the new industry
                  void queryClient.invalidateQueries({ queryKey: ["services"] });
                  void queryClient.invalidateQueries({ queryKey: ["menu-items"] });
                  void queryClient.invalidateQueries({ queryKey: ["products"] });
                  // Navigation will automatically update based on new capabilities
                  toast.success("Industry updated successfully. Your existing items for this industry will now be displayed.");
                }}
              />
            </div>
          </div>
        );
      case "ai_behavior":
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900">Escalation Settings</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Control when the AI should escalate conversations to a human agent.
              </p>

              {escalationSettingsQuery.isLoading ? (
                <div className="h-24 animate-pulse rounded-lg bg-gray-50" />
              ) : escalationSettingsQuery.data ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {escalationSettingsQuery.data.escalation_behavior === "advanced"
                          ? "Smart Escalation (Pro)"
                          : "Automatic Escalation"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {escalationSettingsQuery.data.escalation_behavior === "always_on" && "AI will escalate when it doesn't know the answer or when requested."}
                        {escalationSettingsQuery.data.escalation_behavior === "configurable" && "You can enable or disable automatic escalation to human agents."}
                        {escalationSettingsQuery.data.escalation_behavior === "advanced" && "AI handles most queries and only escalates high-priority issues (payment, disputes)."}
                      </p>
                    </div>

                    {escalationSettingsQuery.data.is_configurable ? (
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={escalationSettingsQuery.data.enabled}
                          onChange={(e) => updateEscalationMutation.mutate({ enabled: e.target.checked })}
                          disabled={updateEscalationMutation.isPending}
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-primary/80"></div>
                      </label>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                        {escalationSettingsQuery.data.enabled ? "Active" : "Disabled"}
                        {!escalationSettingsQuery.data.enabled && <span className="text-gray-400">(Locked)</span>}
                      </div>
                    )}
                  </div>

                  {!escalationSettingsQuery.data.is_configurable && (
                    <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                      <div className="flex gap-3">
                        <div className="mt-0.5"><div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div></div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">Why can&apos;t I change this?</p>
                          <p className="mt-1 text-sm text-blue-700">
                            {escalationSettingsQuery.data.escalation_behavior === "always_on"
                              ? "Trial plans have escalation enabled by default to ensure you see how AI works with human agents."
                              : "Your plan has advanced AI behavior managed automatically."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-500">Failed to load settings.</div>
              )}
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
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100">
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
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      {billingQuery.data.plan.name}
                    </p>
                    {billingQuery.data.trial.is_trial && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Start Trial • {billingQuery.data.trial.days_remaining} days left
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <p className="text-4xl font-bold text-gray-900">
                      {billingQuery.data.plan.currency} {billingQuery.data.plan.price}
                    </p>
                    <p className="text-xs text-gray-500">
                      per {billingQuery.data.plan.billing_period}
                    </p>
                  </div>

                  <div className="mt-6 space-y-2 text-xs text-gray-600">
                    {billingQuery.data.plan.features.map((feature: string) => (
                      <div key={feature} className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
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
                      {usageQuery.data?.active_seats.used ?? "--"} / {usageQuery.data?.active_seats.limit ?? "--"}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100">
                    <div
                      className="h-2.5 rounded-full bg-primary transition-all"
                      style={{
                        width: usageQuery.data
                          ? `${Math.min(100, (usageQuery.data.active_seats.used / usageQuery.data.active_seats.limit) * 100)}%`
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
      case "whatsapp":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Business Profile</h3>
              <p className="text-sm text-gray-600 mb-6">
                Manage your WhatsApp Business profile settings, including profile picture, business details, and about text.
              </p>
            </div>
            <WhatsAppProfile />
          </div>
        );
      case "security":
        return (
          <div className="max-w-xl space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-dark-surface dark:border-dark-border">
              <div className="flex items-center gap-2 mb-4">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Ensure your account is using a long, random password to stay secure.
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                  toast.error("New passwords do not match");
                  return;
                }
                if (passwordForm.newPassword.length < 8) {
                  toast.error("Password must be at least 8 characters");
                  return;
                }
                changePasswordMutation.mutate(passwordForm);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2" htmlFor="current-password">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-dark-elevated dark:border-dark-border dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2" htmlFor="new-password">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-dark-elevated dark:border-dark-border dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-dark-elevated dark:border-dark-border dark:text-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dark-accent-primary"
                  >
                    {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
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
    escalationSettingsQuery.data,
    escalationSettingsQuery.isLoading,
    updateEscalationMutation,
    isLoadingProfile,
    profileForm,
    updateProfileMutation,
    passwordForm,
    changePasswordMutation,
    tenantIndustry,
    queryClient,
    integrations,
  ]);

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[80px] lg:left-[276px] flex flex-col bg-gray-50 dark:bg-dark-bg">
      <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Modern Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6 shadow-xl dark:border-gray-600 dark:from-primary dark:via-primary/90 dark:to-primary/80 sm:p-8 md:p-10">
            <div className="absolute inset-0 opacity-10 dark:opacity-20">
              <div className="absolute inset-0 dark:hidden" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }} />
              <div className="absolute inset-0 hidden dark:block" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <SettingsIcon className="h-6 w-6 text-white/90 sm:h-7 sm:w-7" />
                <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Workspace Settings</h1>
              </div>
              <p className="text-sm text-white/90 sm:text-base md:text-lg max-w-2xl">
                Manage your profile, channels, billing, notifications, and team
              </p>
            </div>
          </div>

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
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab.key
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
      </div>
    </div>
  );
}

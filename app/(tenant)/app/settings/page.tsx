'use client';

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  useBilling,
  useTeamMembers,
  useUsage,
} from "../../hooks/useSettingsData";

type TabKey = "profile" | "notifications" | "team" | "billing";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "profile", label: "Business profile" },
  { key: "notifications", label: "Notifications" },
  { key: "team", label: "Team" },
  { key: "billing", label: "Billing & plan" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const teamQuery = useTeamMembers();
  const billingQuery = useBilling();
  const usageQuery = useUsage();

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case "profile":
        return (
          <form className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="business-name">
                Business name
              </label>
              <input
                id="business-name"
                type="text"
                defaultValue="Brancr AI Technologies"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="timezone">
                  Timezone
                </label>
                <select
                  id="timezone"
                  defaultValue="Africa/Lagos"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="Africa/Lagos">GMT+1 — Africa/Lagos</option>
                  <option value="Africa/Nairobi">GMT+3 — Africa/Nairobi</option>
                  <option value="Europe/London">GMT — Europe/London</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="industry">
                  Industry
                </label>
                <select
                  id="industry"
                  defaultValue="Commerce"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option>Commerce</option>
                  <option>Services</option>
                  <option>Hospitality</option>
                  <option>Agency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Brand logo</label>
              <div className="mt-3 flex items-center gap-4">
                <Image src="/logo-dark.svg" alt="Brand logo" width={64} height={64} className="rounded-xl border border-gray-200 bg-white p-2" />
                <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary hover:text-primary">
                  Upload new
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90">
                Save profile
              </button>
            </div>
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


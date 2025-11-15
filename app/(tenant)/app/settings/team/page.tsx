'use client';

import { useTenant } from "@/app/(tenant)/providers/TenantProvider";

const mockTeamMembers = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "Owner",
    status: "Active",
    joinedAt: "Jan 1, 2025",
  },
];

export default function TeamSettingsPage() {
  const { tenant } = useTenant();

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Team Members</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Manage team members, roles, and permissions.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
        >
          Invite Member
        </button>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <div className="space-y-4">
          {mockTeamMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-semibold text-primary">
                    {tenant?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{tenant?.name}</p>
                    <p className="text-xs text-gray-500">{tenant?.email}</p>
                    <p className="mt-1 text-xs text-gray-400">Joined {member.joinedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {member.role}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    {member.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-sm font-semibold text-amber-900">Team Management Coming Soon</h3>
          <p className="mt-2 text-sm text-amber-700">
            Team management features are currently in development. The API endpoints are available, but the UI for inviting team members, assigning roles, and managing permissions will be available soon.
          </p>
          <p className="mt-3 text-xs text-amber-600">
            Current API endpoints: <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">/api/tenant/team/members</code> returns the current tenant owner.
            Invite and management endpoints return 501 Not Implemented.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Roles & Permissions</h2>
        <p className="mt-2 text-sm text-gray-600">
          Define custom roles and granular permissions for your team.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-semibold text-gray-900">Owner</p>
            <p className="mt-2 text-xs text-gray-500">Full access to all features and settings</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-semibold text-gray-900">Admin</p>
            <p className="mt-2 text-xs text-gray-500">Manage team, campaigns, and integrations</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-semibold text-gray-900">Member</p>
            <p className="mt-2 text-xs text-gray-500">View analytics and manage conversations</p>
          </div>
        </div>
      </section>
    </div>
  );
}


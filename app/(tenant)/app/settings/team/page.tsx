'use client';

import { useState } from "react";
import { useTenant } from "@/app/(tenant)/providers/TenantProvider";
import { useQuery } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";
import { useTeamMembers, useInviteTeamMember, useDeleteTeamMember } from "@/app/(tenant)/hooks/useTeam";

const ROLES = ["Owner", "Admin", "Member"];

export default function TeamSettingsPage() {
  const { tenant } = useTenant();
  const { data: rolesData } = useQuery({ queryKey: ["team", "roles"], queryFn: () => tenantApi.teamRoles(), retry: 0 });
  const { data: invitationsData } = useQuery({ queryKey: ["team", "invitations"], queryFn: () => tenantApi.teamInvitations(), retry: 0 });
  const { data: teamMembers = [], isLoading, error } = useTeamMembers();
  const inviteMutation = useInviteTeamMember();
  const deleteMutation = useDeleteTeamMember();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "Member",
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteMutation.mutateAsync({
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      });
      setInviteForm({ email: "", role: "Member" });
      setShowInviteModal(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDelete = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove "${memberName}" from the team? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(memberId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Team Members</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Manage team members, roles, and permissions.
          </p>
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
            ℹ️ Team management features are in development. Some endpoints may return &quot;Not Implemented&quot; until backend is complete.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
        >
          Invite Member
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm font-semibold text-rose-900">Failed to load team members</p>
            <p className="mt-2 text-xs text-rose-700">{error.message}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm font-semibold text-gray-900">No team members found</p>
                <p className="mt-2 text-xs text-gray-600">Invite team members to collaborate on your workspace.</p>
              </div>
            ) : (
              teamMembers.map((member) => {
                const isCurrentUser = member.email === tenant?.email;
                return (
                  <div key={member.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-semibold text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                          {member.joined_at && (
                            <p className="mt-1 text-xs text-gray-400">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {member.role}
                        </span>
                        {member.status && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            {member.status}
                          </span>
                        )}
                        {!isCurrentUser && member.role !== "Owner" && (
                          <button
                            type="button"
                            onClick={() => handleDelete(member.id, member.name)}
                            disabled={deleteMutation.isPending}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                        {!isCurrentUser && rolesData?.roles ? (
                          <select
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                            defaultValue={member.role}
                            onChange={async (e) => {
                              try {
                                await tenantApi.updateTeamMember(member.id, { role: e.target.value });
                                location.reload();
                              } catch {}
                            }}
                          >
                            {rolesData.roles.map((r) => (
                              <option key={r.id} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {inviteMutation.isError && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Team Management Coming Soon</p>
            <p className="mt-2 text-xs text-amber-700">
              Team management features are currently in development. The API endpoints are available, but invite and management operations return 501 Not Implemented.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Pending invitations</h2>
        <p className="mt-2 text-sm text-gray-600">Invitations sent but not yet accepted.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sent</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {(invitationsData?.invitations || []).map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3">{inv.email}</td>
                  <td className="px-4 py-3">{inv.role}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(inv.sent_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-rose-600 hover:text-rose-700" onClick={() => tenantApi.revokeInvitation(inv.id)}>
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
              {(invitationsData?.invitations || []).length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-xs text-gray-500" colSpan={4}>
                    No pending invitations
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteForm({ email: "", role: "Member" });
                }}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="invite-email" className="block text-sm font-semibold text-gray-900">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  id="invite-email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="colleague@example.com"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label htmlFor="invite-role" className="block text-sm font-semibold text-gray-900">
                  Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-2">
                  <select
                    id="invite-role"
                    required
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteForm({ email: "", role: "Member" });
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


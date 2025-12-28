'use client';

import { useState } from "react";
import { usePaymentAccounts, useCreatePaymentAccount, useUpdatePaymentAccount, useDeletePaymentAccount, useSetDefaultPaymentAccount, type PaymentAccount } from "../../../hooks/usePaymentAccounts";
import {
  CreditCardIcon,
  PlusIcon,
  XIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
} from "../../../components/icons";
import { toast } from "react-hot-toast";
import { getUserFriendlyErrorMessage } from '@/lib/error-messages';
import Select from "@/app/(tenant)/components/ui/Select";
import ConfirmModal from '@/app/components/ConfirmModal';

export default function PaymentAccountsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);

  const { data: accounts = [], isLoading, error } = usePaymentAccounts();
  const createMutation = useCreatePaymentAccount();
  const updateMutation = useUpdatePaymentAccount();
  const deleteMutation = useDeletePaymentAccount();
  const setDefaultMutation = useSetDefaultPaymentAccount();

  const [showDeleteAccountId, setShowDeleteAccountId] = useState<number | null>(null);
  const handleDelete = (accountId: number) => {
    setShowDeleteAccountId(accountId);
  };
  const confirmDeleteAccount = (accountId: number) => {
    deleteMutation.mutate(accountId);
    setShowDeleteAccountId(null);
  };

  const handleSetDefault = (accountId: number) => {
    setDefaultMutation.mutate(accountId);
  };

  const maskAccountNumber = (accountNumber?: string) => {
    if (!accountNumber) return "";
    if (accountNumber.length <= 4) return accountNumber;
    return "****" + accountNumber.slice(-4);
  };

  return (
    <div className="space-y-6">
      {showDeleteAccountId && (
        <ConfirmModal
          open={true}
          title="Delete payment account"
          description="Are you sure you want to delete this payment account? This cannot be undone."
          confirmText="Delete"
          onConfirm={() => { if (showDeleteAccountId) confirmDeleteAccount(showDeleteAccountId); }}
          onCancel={() => setShowDeleteAccountId(null)}
        />
      )}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCardIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Payment Accounts</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your payment account details for order payments</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingAccount(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          <PlusIcon className="w-4 h-4" />
          Add Payment Account
        </button>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
          <XIcon className="mx-auto h-12 w-12 text-rose-400" />
          <p className="mt-3 text-sm font-semibold text-rose-900">Failed to load payment accounts</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
          <CreditCardIcon className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg font-semibold text-gray-900">No payment accounts</p>
          <p className="mt-2 text-sm text-gray-600">Add your first payment account to receive payments from orders.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            <PlusIcon className="w-4 h-4" />
            Add Payment Account
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`rounded-xl border-2 p-4 transition ${
                account.is_default
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{account.account_name}</h3>
                    {account.is_default && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                        Default
                      </span>
                    )}
                    {!account.is_active && (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 capitalize">
                      Type: <span className="font-medium">{account.account_type.replace("_", " ")}</span>
                    </p>
                    {account.account_type === "bank" && (
                      <>
                        {account.bank_name && (
                          <p className="text-sm text-gray-600">
                            Bank: <span className="font-medium">{account.bank_name}</span>
                          </p>
                        )}
                        {account.account_number && (
                          <p className="text-sm text-gray-600">
                            Account: <span className="font-medium">{maskAccountNumber(account.account_number)}</span>
                          </p>
                        )}
                      </>
                    )}
                    {account.account_type === "mobile_money" && (
                      <>
                        {account.provider && (
                          <p className="text-sm text-gray-600">
                            Provider: <span className="font-medium">{account.provider}</span>
                          </p>
                        )}
                        {account.phone_number && (
                          <p className="text-sm text-gray-600">
                            Phone: <span className="font-medium">{account.phone_number}</span>
                          </p>
                        )}
                      </>
                    )}
                    {account.account_type === "cash" && account.description && (
                      <p className="text-sm text-gray-600">{account.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!account.is_default && (
                    <button
                      onClick={() => handleSetDefault(account.id)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingAccount(account);
                      setIsCreateModalOpen(true);
                    }}
                    className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 transition hover:border-primary hover:text-primary"
                    aria-label="Edit payment account"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100"
                    aria-label="Delete payment account"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isCreateModalOpen || editingAccount) && (
        <PaymentAccountFormModal
          account={editingAccount}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingAccount(null);
          }}
          onCreate={createMutation.mutateAsync}
          onUpdate={(payload) => {
            if (!editingAccount) return Promise.reject(new Error('No account selected'));
            return updateMutation.mutateAsync({ accountId: editingAccount.id, payload });
          }}
        />
      )}
    </div>
  );
}

function PaymentAccountFormModal({
  account,
  onClose,
  onCreate,
  onUpdate,
}: {
  account: PaymentAccount | null;
  onClose: () => void;
  onCreate: (payload: any) => Promise<any>;
  onUpdate: (payload: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    account_type: (account?.account_type || "bank") as "bank" | "mobile_money" | "cash",
    bank_name: account?.bank_name || "",
    account_number: account?.account_number || "",
    account_name: account?.account_name || "",
    provider: account?.provider || "",
    phone_number: account?.phone_number || "",
    description: account?.description || "",
    is_default: account?.is_default || false,
    is_active: account?.is_active !== false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = {
        account_type: formData.account_type,
        account_name: formData.account_name,
        is_default: formData.is_default,
      };

      if (formData.account_type === "bank") {
        payload.bank_name = formData.bank_name;
        payload.account_number = formData.account_number;
      } else if (formData.account_type === "mobile_money") {
        payload.provider = formData.provider;
        payload.phone_number = formData.phone_number;
      } else if (formData.account_type === "cash") {
        payload.description = formData.description;
      }

      if (account) {
        payload.is_active = formData.is_active;
        await onUpdate(payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (error: any) {
      console.error("Form submission error:", error);
      // Prefer ApiError details where available
      if (error && error.status) {
        console.error('API error details:', { status: error.status, body: error.body });
        toast.error(getUserFriendlyErrorMessage(error, { action: account ? 'updating payment account' : 'creating payment account', resource: 'payment account' }));
      } else {
        toast.error('Failed to submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{account ? "Edit Payment Account" : "Add Payment Account"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
            title="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Account Type *</label>
            <div className="mt-1">
              <Select
                value={formData.account_type}
                onChange={(value) => {
                  if (!value) return;
                  setFormData({ ...formData, account_type: value as any });
                }}
                options={[
                  { value: 'bank', label: 'Bank Transfer' },
                  { value: 'mobile_money', label: 'Mobile Money' },
                  { value: 'cash', label: 'Cash' },
                ]}
                searchable={false}
              />
            </div>
          </div>

          <div>
            <label htmlFor="account_name" className="block text-sm font-semibold text-gray-700">Account Name *</label>
            <input
              id="account_name"
              type="text"
              required
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {formData.account_type === "bank" && (
            <>
              <div>
                <label htmlFor="bank_name" className="block text-sm font-semibold text-gray-700">Bank Name *</label>
                <input
                  id="bank_name"
                  type="text"
                  required
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="account_number" className="block text-sm font-semibold text-gray-700">Account Number *</label>
                <input
                  id="account_number"
                  type="text"
                  required
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}

          {formData.account_type === "mobile_money" && (
            <>
              <div>
                <label htmlFor="provider" className="block text-sm font-semibold text-gray-700">Provider *</label>
                <input
                  id="provider"
                  type="text"
                  required
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="MTN, Airtel, etc."
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="phone_number" className="block text-sm font-semibold text-gray-700">Phone Number *</label>
                <input
                  id="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}

          {formData.account_type === "cash" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Cash pickup location or instructions..."
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">Set as default account</span>
            </label>
            {account && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {isSubmitting ? "Saving..." : account ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


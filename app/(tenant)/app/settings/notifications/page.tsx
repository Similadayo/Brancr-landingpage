'use client';

import { useState, useEffect } from 'react';
import { useNotificationSettings, useUpdateNotificationSettings, useTestNotifications } from '../../../hooks/useNotifications';
import { SettingsIcon, CheckCircleIcon, XIcon } from '../../../components/icons';
import { toast } from 'react-hot-toast';

export default function NotificationSettingsPage() {
  const comingSoon = true;
  const { data: settings, isLoading } = useNotificationSettings();
  const updateMutation = useUpdateNotificationSettings();
  const testMutation = useTestNotifications();

  const [localSettings, setLocalSettings] = useState({
    email_notifications: {
      enabled: false,
      order_status_changes: false,
      payment_confirmations: false,
      receipt_generated: false,
    },
    webhook: {
      enabled: false,
      url: '',
      events: [] as string[],
    },
  });

  // Update local state when settings load (merge with defaults to avoid undefined nested fields)
  useEffect(() => {
    if (settings) {
      setLocalSettings((prev) => ({
        email_notifications: settings.email_notifications ?? prev.email_notifications,
        webhook: settings.webhook ?? prev.webhook,
      }));
    }
  }, [settings]);

  const handleEmailToggle = (field: keyof typeof localSettings.email_notifications, value: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      email_notifications: {
        ...prev.email_notifications,
        [field]: value,
      },
    }));
  };

  const handleWebhookToggle = (field: keyof typeof localSettings.webhook, value: boolean | string) => {
    setLocalSettings((prev) => ({
      ...prev,
      webhook: {
        ...prev.webhook,
        [field]: value,
      },
    }));
  };

  const handleEventToggle = (event: string) => {
    setLocalSettings((prev) => {
      const events = prev.webhook.events.includes(event)
        ? prev.webhook.events.filter((e) => e !== event)
        : [...prev.webhook.events, event];
      return {
        ...prev,
        webhook: {
          ...prev.webhook,
          events,
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(localSettings);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleTest = async () => {
    try {
      await testMutation.mutateAsync();
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Notification Settings</h1>
            <p className="mt-1 text-sm text-gray-600">Configure email and webhook notifications</p>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">Inbox notifications are live.</p>
        <p className="mt-1 text-amber-800">Email and webhook alerts are marked as coming soon so tenants can clearly see they differ from the in-app inbox.</p>
      </div>

      {/* Email Notifications */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
          {comingSoon && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
              Coming soon
            </span>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Enable Email Notifications</p>
              <p className="text-xs text-gray-600">Send email notifications to customers</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={localSettings.email_notifications.enabled}
                onChange={(e) => handleEmailToggle('enabled', e.target.checked)}
                className="peer sr-only"
                aria-label="Enable email notifications"
                disabled={comingSoon}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-60"></div>
            </label>
          </div>

          {localSettings.email_notifications.enabled && (
            <div className="ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Order Status Changes</p>
                  <p className="text-xs text-gray-600">Notify when order status changes</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={localSettings.email_notifications.order_status_changes}
                    onChange={(e) => handleEmailToggle('order_status_changes', e.target.checked)}
                    className="peer sr-only"
                    aria-label="Notify on order status changes"
                    disabled={comingSoon}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-60"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Payment Confirmations</p>
                  <p className="text-xs text-gray-600">Notify when payment is confirmed</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={localSettings.email_notifications.payment_confirmations}
                    onChange={(e) => handleEmailToggle('payment_confirmations', e.target.checked)}
                    className="peer sr-only"
                    aria-label="Notify on payment confirmations"
                    disabled={comingSoon}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-60"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Receipt Generated</p>
                  <p className="text-xs text-gray-600">Notify when receipt is generated</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={localSettings.email_notifications.receipt_generated}
                    onChange={(e) => handleEmailToggle('receipt_generated', e.target.checked)}
                    className="peer sr-only"
                    aria-label="Notify when receipt is generated"
                    disabled={comingSoon}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-60"></div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Webhook Configuration</h2>
          {comingSoon && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
              Coming soon
            </span>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Enable Webhooks</p>
              <p className="text-xs text-gray-600">Send webhook notifications to your endpoint</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={localSettings.webhook.enabled}
                onChange={(e) => handleWebhookToggle('enabled', e.target.checked)}
                className="peer sr-only"
                aria-label="Enable webhook notifications"
                disabled={comingSoon}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-60"></div>
            </label>
          </div>

          {localSettings.webhook.enabled && (
            <div className="ml-4 space-y-4 border-l-2 border-gray-200 pl-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Webhook URL</label>
                <input
                  type="url"
                  value={localSettings.webhook.url}
                  onChange={(e) => handleWebhookToggle('url', e.target.value)}
                  placeholder="https://your-endpoint.com/webhook"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                  disabled={comingSoon}
                />
                <p className="mt-1 text-xs text-gray-500">Your webhook endpoint URL</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Events</label>
                <div className="space-y-2">
                  {['order.created', 'order.status_changed', 'payment.confirmed', 'receipt.generated'].map((event) => (
                    <label key={event} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localSettings.webhook.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
                        disabled={comingSoon}
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleTest}
          disabled={testMutation.isPending || comingSoon}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {testMutation.isPending ? 'Testing...' : 'Test Notifications'}
        </button>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending || comingSoon}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}


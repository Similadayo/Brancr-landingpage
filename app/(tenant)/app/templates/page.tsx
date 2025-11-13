'use client';

import Link from "next/link";

const mockTemplates = [
  {
    id: "template-001",
    name: "Welcome Message",
    category: "Onboarding",
    description: "Greet new customers and introduce your business",
    uses: 234,
  },
  {
    id: "template-002",
    name: "Order Confirmation",
    category: "Transactional",
    description: "Confirm customer orders with details and tracking",
    uses: 567,
  },
  {
    id: "template-003",
    name: "Promotional Offer",
    category: "Marketing",
    description: "Announce special offers and discounts",
    uses: 189,
  },
  {
    id: "template-004",
    name: "Appointment Reminder",
    category: "Notifications",
    description: "Send automated appointment reminders",
    uses: 345,
  },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 lg:text-4xl">Message Templates</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Pre-approved message templates for WhatsApp Business and other platforms.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
        >
          Create Template
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {mockTemplates.map((template) => (
          <div
            key={template.id}
            className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <span className="mt-2 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {template.category}
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">{template.description}</p>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-gray-500">{template.uses} uses</p>
              <button
                type="button"
                disabled
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 opacity-50 cursor-not-allowed"
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
        <h3 className="text-sm font-semibold text-amber-900">Coming Soon</h3>
        <p className="mt-2 text-sm text-amber-700">
          Template creation and management features are currently in development. You&apos;ll be able to create custom
          templates, submit them for approval, and manage them here soon.
        </p>
        <Link
          href="mailto:contact@brancr.com?subject=Template%20Feature%20Inquiry"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
        >
          Contact us about templates
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}


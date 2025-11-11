import Link from "next/link";
import { mockOnboardingStatus, mockScheduledPosts, mockChannels } from "@/lib/mockData";

const onboardingSteps = [
  {
    id: "01",
    title: "Connect your channels",
    description:
      "Link WhatsApp, Instagram, Facebook, or Telegram so Brancr can centralise customer conversations and automation events.",
    action: { label: "Open integrations", href: "/app/integrations" },
    done: mockChannels.some((channel) => channel.status === "connected"),
  },
  {
    id: "02",
    title: "Invite your teammates",
    description:
      "Give your customer or marketing team access so they can respond faster, assign conversations, and collaborate on campaigns.",
    action: { label: "Manage team", href: "/app/settings/team" },
    done: mockOnboardingStatus.teammateInvited,
  },
  {
    id: "03",
    title: "Schedule your first post",
    description:
      "Create a broadcast or post so Brancr can automate delivery at the right time across your channels.",
    action: { label: "Create post", href: "/app/campaigns/new" },
    done: mockOnboardingStatus.firstPostScheduled || mockScheduledPosts.length > 0,
  },
  {
    id: "04",
    title: "Configure notifications & webhooks",
    description:
      "Stay in the loop with channel alerts, escalation rules, and developer webhooks to keep your stack in sync.",
    action: { label: "Configure settings", href: "/app/settings/api" },
    done: mockOnboardingStatus.notificationsConfigured,
  },
];

export default function OnboardingPage() {
  return (
    <div className="space-y-10">
      <header className="overflow-hidden rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-lg shadow-primary/10">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Start fast
        </span>
        <h1 className="mt-6 text-3xl font-semibold text-gray-900 lg:text-4xl">Brancr onboarding guide</h1>
        <p className="mt-4 max-w-2xl text-base text-gray-600">
          Complete these quick steps to get your tenant workspace ready for automation. Connect your channels, invite your
          team, and launch your first campaign — we’ll guide you through each milestone.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href="/app/integrations"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
          >
            Connect channels <span aria-hidden>↗</span>
          </Link>
          <Link
            href="/app/support"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Talk to support
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        {onboardingSteps.map((step) => (
          <article
            key={step.id}
            className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                {step.id}
              </span>
              <span className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gray-400">
                {step.done ? "Completed" : "Pending"}
              </span>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-gray-900">{step.title}</h2>
            <p className="mt-3 text-sm text-gray-600">{step.description}</p>
            <Link
              href={step.action.href}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
            >
              {step.action.label} <span aria-hidden>↗</span>
            </Link>
            {step.done ? (
              <span className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                ✓ Completed
              </span>
            ) : null}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition group-hover:opacity-100" />
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Need help getting started?</h3>
          <p className="mt-3 text-sm text-gray-600">
            Our concierge team is on WhatsApp and email to help you connect channels, set up templates, and migrate customer
            journeys.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href="https://wa.me/2348123456789"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Chat on WhatsApp
            </Link>
            <Link
              href="mailto:contact@brancr.com"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Email contact@brancr.com
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Developer checklist</h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
              Add allowed origins to your backend CORS policy: <code className="rounded bg-gray-100 px-2 py-0.5">https://www.brancr.com</code>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
              Issue API keys and webhooks from <Link href="/app/settings/api" className="font-semibold text-primary">API &amp; webhooks</Link>.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
              Review the automation docs and sample payloads in the Brancr developer portal.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}



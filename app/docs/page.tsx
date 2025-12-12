import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation - Brancr",
  description: "Brancr platform documentation and guides",
};

export default function DocsPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-neutral-bg">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(154,106,255,0.15),_transparent_55%)]"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-12">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          Brancr
        </Link>
        <Link
          href="/app"
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
        >
          Back to Dashboard
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-12 text-center sm:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.5em] text-primary">Coming Soon</p>
        <h1 className="mt-6 text-4xl font-semibold text-gray-900 sm:text-5xl">
          Documentation
        </h1>
        <p className="mt-4 text-base text-gray-600 sm:text-lg">
          Comprehensive guides and API documentation are coming soon.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/app"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90"
          >
            Return to Dashboard
          </Link>
          <Link
            href="mailto:contact@brancr.com"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Contact Support
          </Link>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 sm:px-12">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 text-left shadow-sm shadow-primary/5">
          <h2 className="text-lg font-semibold text-gray-900">Quick Integration Guides</h2>
          <p className="mt-2 text-sm text-gray-600">Short setup notes for the Integrations page guide links.</p>

          <div className="mt-6 space-y-8">
            <section id="whatsapp-business" className="scroll-mt-24">
              <h3 className="text-base font-semibold text-gray-900">WhatsApp Business (Brancr Official Number)</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>Use a number not currently active on the WhatsApp mobile app.</li>
                <li>If the number is on WhatsApp mobile, delete the WhatsApp account, wait 3 minutes, then connect in Brancr.</li>
                <li>Once connected, WhatsApp messages appear inside the Brancr Dashboard.</li>
              </ul>
            </section>

            <section id="instagram" className="scroll-mt-24">
              <h3 className="text-base font-semibold text-gray-900">Instagram</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>Use an Instagram Business Account.</li>
                <li>Link it to a Facebook Page you have admin access to.</li>
                <li>Return to Integrations and click Verify.</li>
              </ul>
            </section>

            <section id="facebook" className="scroll-mt-24">
              <h3 className="text-base font-semibold text-gray-900">Facebook Page</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>Confirm you have admin access to the Page.</li>
                <li>Return to Integrations and click Verify.</li>
              </ul>
            </section>

            <section id="telegram" className="scroll-mt-24">
              <h3 className="text-base font-semibold text-gray-900">Telegram Bot</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>Create a bot using BotFather and copy the Bot Token.</li>
                <li>Return to Integrations and click Verify.</li>
              </ul>
            </section>

            <section id="tiktok-shop" className="scroll-mt-24">
              <h3 className="text-base font-semibold text-gray-900">TikTok Shop</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>Use a registered TikTok Shop Seller account.</li>
                <li>Return to Integrations and click Verify.</li>
              </ul>
            </section>
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-gray-500 sm:px-12">
        © {new Date().getFullYear()} Brancr. All rights reserved.
      </footer>
    </main>
  );
}


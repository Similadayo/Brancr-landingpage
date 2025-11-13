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

      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-gray-500 sm:px-12">
        © {new Date().getFullYear()} Brancr. All rights reserved.
      </footer>
    </main>
  );
}


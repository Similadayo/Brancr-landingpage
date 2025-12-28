import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Brancr Launch Update",
  description:
    "We’re preparing Brancr’s AI-powered automation platform for wider release. Sign up for early access or explore the product preview.",
};

export default function PrelaunchPage() {
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
        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/home" className="transition hover:text-primary">
            Explore product
          </Link>
          <Link
            href="/waitlist"
            className="rounded-full bg-primary px-4 py-2 font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
          >
            Request access
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-12 text-center sm:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.5em] text-primary">Coming Soon</p>
        <h1 className="mt-6 text-4xl font-semibold text-gray-900 sm:text-5xl">
          Automate social messaging while we finish the launch.
        </h1>
        <p className="mt-4 text-base text-gray-600 sm:text-lg">
          Brancr is in early access with select tenants. Explore the live product demo or join the waitlist to get
          notified when we open the doors.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/home"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 dark:bg-white dark:text-gray-100 dark:hover:bg-gray-100"
          >
            Explore the product preview
          </Link>
        </div>
      </section>

      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-gray-500 sm:px-12">
        © {new Date().getFullYear()} Brancr. All rights reserved.
      </footer>
    </main>
  );
}

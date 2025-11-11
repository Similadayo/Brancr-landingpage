import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="relative hidden w-full max-w-xl flex-1 overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-primary/60 px-12 py-12 text-white lg:flex">
          <div className="flex min-h-full flex-col">
            <div className="flex items-center gap-3 text-lg font-semibold">
              <Image src="/logo-light.svg" alt="Brancr" width={40} height={40} />
              Brancr Tenant Dashboard
            </div>
            <div className="mt-auto">
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">Automation for Modern Teams</p>
              <h2 className="mt-6 text-4xl font-semibold leading-snug">
                Connect your social channels, organise conversations, and automate customer engagement from one clean
                workspace.
              </h2>
              <p className="mt-4 text-base text-white/80">
                Manage Instagram, Facebook, WhatsApp, TikTok and more. Brancr keeps your team aligned with campaigns,
                inbox assignment, analytics, and AI assistance.
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.45),transparent_55%)]" />
        </div>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between px-6 py-6 sm:px-10">
            <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <Image src="/logo-dark.svg" alt="Brancr" width={36} height={36} />
              Brancr
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/pricing" className="hover:text-primary transition">
                Pricing
              </Link>
              <Link href="/contact" className="hover:text-primary transition">
                Contact
              </Link>
            </nav>
          </header>

          <main className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-8">
            <div className="w-full max-w-md">{children}</div>
          </main>

          <footer className="px-6 pb-6 text-center text-xs text-gray-500 sm:px-8">
            © {new Date().getFullYear()} Brancr. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
}


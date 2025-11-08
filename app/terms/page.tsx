import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service – Brancr",
  description: "Brancr&apos;s Terms of Service govern your use of our AI-powered marketing assistant platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-bg">
      <Header />
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-primary transition-colors mb-8"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-gray-100">
            <header className="border-b border-gray-100 pb-8 mb-10">
              <p className="text-sm font-semibold text-primary uppercase tracking-[0.3em] mb-3">
                Terms of Service
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Brancr AI Technologies
              </h1>
              <p className="text-sm text-gray-600">
                Effective Date: November 2025
              </p>
            </header>

            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  These Terms of Service (&quot;Terms&quot;) govern your access to and use of Brancr&apos;s
                  website, applications, and related services (&quot;Services&quot;). By creating an
                  account or using our platform, you agree to these Terms.
                </p>

                <section id="service-description" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Service Description</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Brancr provides an online AI automation platform that enables verified businesses
                    to connect their social-media and messaging accounts (including Facebook,
                    Instagram, and WhatsApp) for post scheduling, audience engagement, and analytics.
                  </p>
                </section>

                <section id="eligibility" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
                  <p className="text-gray-700 leading-relaxed">
                    You must be at least 18 years old and have the authority to represent your business.
                    By using Brancr, you confirm that you are authorized to connect and manage your
                    organization&apos;s Meta assets.
                  </p>
                </section>

                <section id="account-registration" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You agree to:
                  </p>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>Provide accurate registration information.</li>
                    <li>Maintain the security of your credentials.</li>
                    <li>Promptly notify us of unauthorized use.</li>
                  </ul>
                </section>

                <section id="connected-accounts" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    4. Use of Connected Accounts
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    By connecting a Facebook Page, Instagram Business Account, or WhatsApp Business
                    Account, you grant Brancr permission to access and manage that account&apos;s data
                    strictly through authorized Meta APIs.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    You remain responsible for complying with all Meta Platform Terms, including the
                    Meta Developer Policies.
                  </p>
                </section>

                <section id="subscriptions" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    5. Subscriptions and Payments
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    Certain features require a paid subscription. Fees are billed according to your
                    selected plan and processed through secure third-party payment providers. All fees
                    are non-refundable except as required by law.
                  </p>
                </section>

                <section id="acceptable-use" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Acceptable Use</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>Use Brancr for spam, deceptive content, or unlawful activity.</li>
                    <li>Misuse automation to violate Meta or local laws.</li>
                    <li>Reverse engineer or disrupt our Services.</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    We may suspend or terminate accounts violating these terms.
                  </p>
                </section>

                <section id="data-ownership" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Ownership</h2>
                  <p className="text-gray-700 leading-relaxed">
                    You retain ownership of all data and content you submit or generate through Brancr.
                    By using our Services, you grant Brancr a limited license to process and transmit
                    data solely to provide the Services.
                  </p>
                </section>

                <section id="intellectual-property" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    8. Intellectual Property
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    All Brancr software, trademarks, and branding remain our exclusive property. You may
                    not copy or redistribute Brancr&apos;s software components without written consent.
                  </p>
                </section>

                <section id="liability" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    9. Limitation of Liability
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    To the maximum extent permitted by law, Brancr is not liable for any indirect,
                    incidental, or consequential damages arising from use of our Services.
                  </p>
                </section>

                <section id="termination" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
                  <p className="text-gray-700 leading-relaxed">
                    You may terminate your account at any time. We may suspend or terminate access for
                    violation of these Terms or applicable law.
                  </p>
                </section>

                <section id="governing-law" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
                  <p className="text-gray-700 leading-relaxed">
                    These Terms are governed by the laws of the Federal Republic of Nigeria, without
                    regard to conflict-of-law principles.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact</h2>
                  <address className="not-italic text-gray-700 leading-relaxed space-y-1">
                    <p>Brancr AI Technologies</p>
                    <p>Lagos, Nigeria</p>
                    <p>
                      Email:{" "}
                      <a
                        href="mailto:support@brancr.com"
                        className="text-accent hover:underline"
                      >
                        support@brancr.com
                      </a>
                    </p>
                  </address>
                </section>
              </div>

              <aside className="border border-gray-100 rounded-xl bg-gray-50/60 p-6 h-fit">
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500 mb-4">
                  Quick Reference
                </h2>
                <p className="text-sm text-gray-600 leading-6 mb-6">
                  Use these links to navigate key clauses. Reading the full agreement is recommended
                  before using Brancr services.
                </p>
                <nav className="space-y-3 text-sm">
                  <a href="#service-description" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Service Description
                  </a>
                  <a href="#eligibility" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Eligibility
                  </a>
                  <a href="#account-registration" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Account Registration
                  </a>
                  <a href="#connected-accounts" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Connected Accounts
                  </a>
                  <a href="#subscriptions" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Subscriptions &amp; Payments
                  </a>
                  <a href="#acceptable-use" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Acceptable Use
                  </a>
                  <a href="#data-ownership" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Data Ownership
                  </a>
                  <a href="#intellectual-property" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Intellectual Property
                  </a>
                  <a href="#liability" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Liability
                  </a>
                  <a href="#termination" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Termination
                  </a>
                  <a href="#governing-law" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Governing Law
                  </a>
                  <a href="#contact" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Contact
                  </a>
                </nav>
              </aside>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}


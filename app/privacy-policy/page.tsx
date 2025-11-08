import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – Brancr",
  description: "Brancr&apos;s Privacy Policy explains how we collect, use, and protect your information.",
};

export default function PrivacyPage() {
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
                Privacy Policy
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Brancr AI Technologies
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                  Effective Date: November 2025
                </span>
                <span>Last Updated: November 2025</span>
              </div>
            </header>

            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  Brancr AI Technologies (&quot;Brancr,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides
                  an AI-powered automation platform that enables small and medium-sized
                  businesses to manage and automate their social-media and messaging
                  activities across Meta platforms (Facebook, Instagram, and WhatsApp).
                  This Privacy Policy explains how we collect, use, store, and protect
                  your information when you visit our website www.brancr.com or use our
                  software and connected services.
                </p>

                <section id="information-we-collect" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    1. Information We Collect
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We collect the following categories of data:
                  </p>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>
                      <strong>Account &amp; Contact Information:</strong> name, business name,
                      email address, phone number, and password (where applicable).
                    </li>
                    <li>
                      <strong>Connected-Platform Data:</strong> when you connect a Facebook Page,
                      Instagram Business Account, or WhatsApp Business Account, we receive
                      data permitted by Meta&apos;s Graph API, such as page ID, page name, profile
                      picture, message content, message metadata, post insights, and
                      phone-number ID.
                    </li>
                    <li>
                      <strong>Usage &amp; Technical Data:</strong> IP address, device identifiers,
                      browser type, timestamps, and in-app actions for analytics and
                      performance optimization.
                    </li>
                    <li>
                      <strong>Payment &amp; Subscription Data:</strong> billing contact details and
                      transaction metadata (processed by our PCI-compliant payment partners; we
                      do not store card numbers).
                    </li>
                  </ul>
                </section>

                <section id="how-we-use-information" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    2. How We Use the Information
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We use collected data to:
                  </p>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>Authenticate and manage tenant accounts.</li>
                    <li>Provide, operate, and improve our AI automation services.</li>
                    <li>
                      Schedule, analyze, and publish social-media content on behalf of
                      connected tenants.
                    </li>
                    <li>
                      Enable messaging, template management, and campaign tracking through
                      the Meta WhatsApp Business Platform.
                    </li>
                    <li>Communicate with users about updates, billing, and support.</li>
                    <li>Ensure security, fraud prevention, and compliance with platform policies.</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    We never sell your personal data.
                  </p>
                </section>

                <section id="sharing-and-disclosure" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    3. Sharing and Disclosure
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We share information only with:
                  </p>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>
                      <strong>Service Providers:</strong> infrastructure, storage, AI-model, and
                      analytics partners who process data on our behalf under confidentiality
                      agreements.
                    </li>
                    <li>
                      <strong>Meta Platforms, Inc.:</strong> through authorized API integrations as
                      required to deliver Brancr&apos;s features.
                    </li>
                    <li>
                      <strong>Legal Requirements:</strong> if required by law, regulation, or
                      government request.
                    </li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    All data sharing complies with applicable privacy laws (NDPR, GDPR, and
                    Meta&apos;s Developer Terms).
                  </p>
                </section>

                <section id="storage-security-retention" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    4. Data Storage, Security, and Retention
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Data is stored securely in encrypted databases within reputable cloud
                    environments. We retain data only as long as necessary to provide services
                    or meet legal obligations.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    When a tenant disconnects a social-media account or closes their Brancr
                    account, associated data is deleted or anonymized within 30 days.
                  </p>
                </section>

                <section id="your-rights" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">You may:</p>
                  <ul className="list-disc pl-6 space-y-3 text-gray-700">
                    <li>Access or correct your information.</li>
                    <li>Request deletion of stored data.</li>
                    <li>Withdraw consent to future processing.</li>
                    <li>Contact us for any privacy inquiry.</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    Email:{" "}
                    <a
                      href="mailto:privacy@brancr.com"
                      className="text-accent hover:underline"
                    >
                      privacy@brancr.com
                    </a>
                  </p>
                </section>

                <section id="cookies" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    6. Cookies and Tracking
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    We use essential and analytics cookies to operate the site and improve user
                    experience. You can adjust cookie preferences in your browser settings.
                  </p>
                </section>

                <section id="cross-border" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    7. Cross-Border Data Transfers
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    Data may be processed in jurisdictions outside your country of residence
                    (including the European Union, United States, and Nigeria). We ensure
                    adequate safeguards through data-processing agreements and standard
                    contractual clauses.
                  </p>
                </section>

                <section id="ai-transparency" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    8. AI and Automation Transparency
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    Brancr uses AI algorithms to assist users with content generation, captioning,
                    and automated message responses. Decisions made by AI are subject to human
                    oversight, and users can disable automation features at any time.
                  </p>
                </section>

                <section id="policy-changes" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    9. Changes to This Policy
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    We may update this Privacy Policy periodically. Updates take effect once
                    posted on this page with a revised effective date.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact</h2>
                  <address className="not-italic text-gray-700 leading-relaxed space-y-1">
                    <p>Brancr AI Technologies</p>
                    <p>Lagos, Nigeria</p>
                    <p>
                      Email:{" "}
                      <a
                        href="mailto:contact@brancr.com"
                        className="text-accent hover:underline"
                      >
                        contact@brancr.com
                      </a>
                    </p>
                  </address>
                </section>
              </div>

              <aside className="border border-gray-100 rounded-xl bg-gray-50/60 p-6 h-fit">
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500 mb-4">
                  Summary
                </h2>
                <p className="text-sm text-gray-600 leading-6 mb-6">
                  This summary highlights key points. Please review the full policy to
                  understand how Brancr handles your data.
                </p>
                <nav className="space-y-3 text-sm">
                  <a href="#information-we-collect" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Information We Collect
                  </a>
                  <a href="#how-we-use-information" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    How We Use Data
                  </a>
                  <a href="#sharing-and-disclosure" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Sharing &amp; Disclosure
                  </a>
                  <a href="#storage-security-retention" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Storage &amp; Security
                  </a>
                  <a href="#your-rights" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Your Rights
                  </a>
                  <a href="#cookies" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Cookies
                  </a>
                  <a href="#cross-border" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Cross-Border Transfers
                  </a>
                  <a href="#ai-transparency" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    AI Transparency
                  </a>
                  <a href="#policy-changes" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Policy Updates
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


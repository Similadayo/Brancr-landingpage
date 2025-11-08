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
              <p className="text-sm font-semibold text-primary uppercase tracking-[0.28em] mb-3">
                Privacy Policy
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Brancr Privacy Policy
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
                <section id="introduction" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Brancr (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides an AI-powered automation platform that helps
                    small and medium-sized businesses manage and automate their social media presence across platforms
                    such as Facebook, Instagram, WhatsApp, YouTube, and TikTok.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    We respect your privacy and are committed to protecting your personal data in compliance with
                    applicable data protection laws, including the Nigerian Data Protection Act (NDPA), EU GDPR, and Meta
                    Platform Terms.
                  </p>
                </section>

                <section id="information-we-collect" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We collect information necessary to deliver our services, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>
                      <strong>Account Information:</strong> Name, email, and business details when you create or onboard a
                      Brancr account.
                    </li>
                    <li>
                      <strong>Connected Platform Data:</strong> When you connect social media accounts (e.g., Facebook,
                      Instagram, YouTube, or WhatsApp), we access only data explicitly authorized via OAuth (such as page
                      IDs, media, messages, and profile info).
                    </li>
                    <li>
                      <strong>Usage Data:</strong> System logs, analytics, and performance data used to improve functionality.
                    </li>
                    <li>
                      <strong>Communication Data:</strong> Messages and content you send or receive through connected
                      platforms for AI-assisted replies or scheduling.
                    </li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    We do not collect or store passwords for any social media platform.
                  </p>
                </section>

                <section id="how-we-use" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We use collected data solely for:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Managing connected social media accounts.</li>
                    <li>Scheduling and publishing posts as requested by tenants.</li>
                    <li>Generating analytics and engagement insights.</li>
                    <li>Enabling AI-powered responses to customer messages.</li>
                    <li>Ensuring system security and compliance.</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    We never sell, rent, or trade user data with third parties.
                  </p>
                </section>

                <section id="storage-security" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Storage and Security</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    All data is stored securely on Brancr’s encrypted servers. Access tokens (e.g., Meta, Google, or TikTok)
                    are stored in encrypted form and used only to perform authorized actions on behalf of users.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    We follow industry-standard best practices for access control, encryption, and data retention.
                  </p>
                </section>

                <section id="data-sharing" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We only share limited data with:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Meta Platforms, Inc., to provide integrations with Facebook, Instagram, and WhatsApp.</li>
                    <li>Google LLC, for YouTube access.</li>
                    <li>
                      OpenAI and affiliated AI providers, for text generation and conversational assistance (if AI features
                      are used).
                    </li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    Each integration strictly follows the API terms of the respective platform.
                  </p>
                </section>

                <section id="your-rights" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">You may:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Request deletion of your account and associated data.</li>
                    <li>Revoke social media permissions at any time from your Meta, YouTube, or TikTok account settings.</li>
                    <li>Request a copy of all stored information related to your business.</li>
                    <li>
                      Contact us at{" "}
                      <a href="mailto:contact@brancr.com" className="text-accent hover:underline">
                        contact@brancr.com
                      </a>{" "}
                      for any data request.
                    </li>
                  </ul>
                </section>

                <section id="data-retention" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We retain data only as long as necessary for business operations or legal compliance. Once deleted,
                    tokens and associated data are permanently removed from our systems.
                  </p>
                </section>

                <section id="childrens-privacy" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children’s Privacy</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Brancr is not intended for use by individuals under the age of 18.
                  </p>
                </section>

                <section id="policy-changes" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We may update this policy periodically. Continued use of our services after any modification constitutes
                    acceptance of the new terms.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact</h2>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    If you have any questions about this policy or your data, contact:
                  </p>
                  <address className="not-italic text-gray-700 leading-relaxed space-y-1">
                    <p>
                      Email:{" "}
                      <a href="mailto:contact@brancr.com" className="text-accent hover:underline">
                        contact@brancr.com
                      </a>
                    </p>
                    <p>Address: Lagos, Nigeria</p>
                  </address>
                </section>
              </div>

              <aside className="border border-gray-100 rounded-xl bg-gray-50/60 p-6 h-fit">
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-500 mb-4">
                  Quick Navigation
                </h2>
                <p className="text-sm text-gray-600 leading-6 mb-6">
                  Review the key sections at a glance, then drill into details that matter for your organisation.
                </p>
                <nav className="space-y-3 text-sm">
                  <a href="#introduction" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Introduction
                  </a>
                  <a href="#information-we-collect" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Information We Collect
                  </a>
                  <a href="#how-we-use" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    How We Use Data
                  </a>
                  <a href="#storage-security" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Storage &amp; Security
                  </a>
                  <a href="#data-sharing" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Data Sharing
                  </a>
                  <a href="#your-rights" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Your Rights
                  </a>
                  <a href="#data-retention" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Data Retention
                  </a>
                  <a href="#childrens-privacy" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Children’s Privacy
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


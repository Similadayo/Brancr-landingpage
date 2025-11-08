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
              <p className="text-sm font-semibold text-primary uppercase tracking-[0.28em] mb-3">
                Terms of Service
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                ⚖️ Brancr Terms of Service
              </h1>
              <p className="text-sm text-gray-600">Effective Date: November 2025</p>
            </header>

            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
              <div className="prose prose-lg max-w-none">
                <section id="acceptance" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                  <p className="text-gray-700 leading-relaxed">
                    By accessing or using Brancr’s services, you agree to these Terms of Service and our Privacy Policy. If
                    you disagree with any part of the terms, you may not use our platform.
                  </p>
                </section>

                <section id="service-description" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Brancr provides an AI-driven automation platform for social media management, enabling users (“tenants”)
                    to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Connect social media accounts via official APIs (Meta, YouTube, TikTok).</li>
                    <li>Schedule and publish posts across multiple platforms.</li>
                    <li>Use AI tools to generate content, captions, and automated replies.</li>
                    <li>Monitor engagement analytics and trends.</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    Each connected account remains the property of its owner. Brancr acts only as a technical service
                    provider.
                  </p>
                </section>

                <section id="responsibilities" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">You agree to:</p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Provide accurate business and contact information.</li>
                    <li>Use Brancr only for lawful purposes.</li>
                    <li>Not misuse or attempt to exploit social platform APIs beyond their intended use.</li>
                    <li>Maintain confidentiality of your access tokens and account credentials.</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    You are solely responsible for the content you publish using Brancr.
                  </p>
                </section>

                <section id="api-compliance" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. API and Platform Compliance</h2>
                  <p className="text-gray-700 leading-relaxed">
                    By using Brancr, you agree to comply with all platform-specific terms, including but not limited to the
                    Meta Platform Terms and Developer Policies, Instagram Graph API Terms, Facebook Pages API Terms,
                    WhatsApp Business Platform Terms, Google APIs Terms of Service (YouTube), and TikTok for Developers API
                    Policy. Brancr operates only through official, secure APIs. We never bypass or scrape data from any
                    third-party platform.
                  </p>
                </section>

                <section id="termination" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Termination</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We reserve the right to suspend or terminate accounts that violate these Terms or applicable laws.
                  </p>
                </section>

                <section id="liability" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Brancr is provided “as is.” We do not guarantee uninterrupted availability or error-free operation.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    We are not liable for losses resulting from third-party API outages, revoked tokens, or unauthorized user
                    actions.
                  </p>
                </section>

                <section id="indemnification" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Indemnification</h2>
                  <p className="text-gray-700 leading-relaxed">
                    You agree to indemnify and hold Brancr harmless from claims arising from your use of the platform or
                    violation of these Terms.
                  </p>
                </section>

                <section id="modifications" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Modifications</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We may update these Terms as needed. Continued use of the platform constitutes acceptance of updated
                    terms.
                  </p>
                </section>

                <section id="governing-law" className="mb-10 scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Governing Law</h2>
                  <p className="text-gray-700 leading-relaxed">
                    These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes will be resolved in the
                    courts of Lagos State.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-32">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact</h2>
                  <p className="text-gray-700 leading-relaxed mb-2">For legal inquiries:</p>
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
                  Quick Reference
                </h2>
                <p className="text-sm text-gray-600 leading-6 mb-6">
                  Jump to a specific clause or scan the entire agreement before connecting your organisation’s accounts.
                </p>
                <nav className="space-y-3 text-sm">
                  <a href="#acceptance" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Acceptance of Terms
                  </a>
                  <a href="#service-description" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Description of Service
                  </a>
                  <a href="#responsibilities" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    User Responsibilities
                  </a>
                  <a href="#api-compliance" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    API Compliance
                  </a>
                  <a href="#termination" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Termination
                  </a>
                  <a href="#liability" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Limitation of Liability
                  </a>
                  <a href="#indemnification" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Indemnification
                  </a>
                  <a href="#modifications" className="flex items-center gap-2 text-gray-700 hover:text-primary transition">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Modifications
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


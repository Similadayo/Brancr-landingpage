import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service – Brancr",
  description: "Brancr's Terms of Service govern your use of our AI-powered marketing assistant platform.",
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
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Brancr Terms of Service
            </h1>
            <p className="text-gray-600 mb-12">Last Updated: November 2025</p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  1. Agreement to Terms
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing or using Brancr ("we," "our," "us"), you agree to
                  these Terms of Service ("Terms"). If you disagree, do not use the
                  site or join the waitlist.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Description of Service
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Brancr provides an AI-powered marketing assistant that helps small
                  and growing businesses manage social media, automate engagement,
                  and analyze performance — all through a simplified chat interface.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The platform is currently in pre-launch / beta phase, and features
                  may change without notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Eligibility</h2>
                <p className="text-gray-700 leading-relaxed mb-4">You must be:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>At least 18 years old, and</li>
                  <li>
                    Authorized to act on behalf of your business (if applicable).
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. Account and Access
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  During pre-launch, joining the waitlist grants early communication
                  access only — not full product use. When Brancr launches, you will
                  receive instructions to create an official account.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You are responsible for maintaining accurate information and
                  securing your communications with Brancr.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
                <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>
                    Use Brancr for unlawful, abusive, or misleading purposes
                  </li>
                  <li>
                    Attempt to reverse engineer, copy, or resell Brancr software
                  </li>
                  <li>
                    Send spam, phishing, or unsolicited messages via the platform
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  Violating these terms may result in termination of access.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  6. Intellectual Property
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  All content, designs, logos (including "Brancr"), trademarks, and
                  software are the exclusive property of Brancr Technologies.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You may not copy, distribute, or modify them without written
                  permission.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Beta Access & Feedback
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you participate in Brancr's beta or early access program, you may
                  share feedback voluntarily. By doing so, you grant us a
                  non-exclusive, royalty-free right to use that feedback to improve
                  Brancr.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We are not liable for any errors, downtime, or loss resulting from
                  beta usage.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Brancr is provided "as is" and "as available." We do not guarantee
                  uninterrupted or error-free operation. You use the platform at your
                  own risk.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We are not responsible for any indirect, incidental, or
                  consequential damages.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Limitation of Liability
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  To the fullest extent permitted by law, Brancr's liability is
                  limited to the amount (if any) you paid us during the 12 months
                  preceding any claim.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may suspend or terminate access if:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>You violate these Terms, or</li>
                  <li>We discontinue or modify the platform.</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  You may stop using Brancr at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  These Terms are governed by the laws of Nigeria.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Any disputes shall be handled by competent courts within Lagos
                  State, Nigeria.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  12. Changes to These Terms
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update these Terms periodically. Continued use after
                  updates means you accept the new terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  For legal or policy-related questions, reach us at:
                </p>
                <p className="text-gray-700 leading-relaxed mb-2">
                  📧{" "}
                  <a
                    href="mailto:legal@brancr.com"
                    className="text-accent hover:underline"
                  >
                    legal@brancr.com
                  </a>
                </p>
                <p className="text-gray-700 leading-relaxed">🌍 brancr.com</p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}


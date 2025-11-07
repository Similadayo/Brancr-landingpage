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
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Brancr Privacy Policy
            </h1>
            <p className="text-gray-600 mb-12">Last Updated: November 2025</p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Welcome to Brancr (&quot;we,&quot; &quot;our,&quot; &quot;us&quot;).
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Brancr is an AI-powered marketing assistant designed to help small
                  and growing businesses manage content, automate social media
                  engagement, and communicate with customers efficiently.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This Privacy Policy explains how we collect, use, and protect your
                  information when you visit our website (brancr.com), join our
                  waitlist, or interact with our pre-launch platform.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  By using Brancr, you agree to this policy. If you do not agree,
                  please do not use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  2. Information We Collect
                </h2>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  a. Information You Provide
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">We may collect:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>
                    Contact information (e.g., name, email address) when you join our
                    waitlist, contact us, or subscribe to updates.
                  </li>
                  <li>
                    Business information (optional) such as your company name, social
                    media links, or preferred platform.
                  </li>
                  <li>
                    Feedback or responses you provide during surveys or beta testing.
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                  b. Automatically Collected Information
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you visit our website, we may collect:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>Device and browser information</li>
                  <li>IP address and approximate location</li>
                  <li>Pages visited, time spent, and referring URLs</li>
                  <li>
                    Cookies or similar tracking technologies to improve your browsing
                    experience
                  </li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  We do not collect or store passwords, payment details, or personal
                  messages from your social media accounts during pre-launch.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  3. How We Use Your Information
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">We use your data to:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>
                    Communicate with you about early access or product updates
                  </li>
                  <li>Improve our AI models and marketing tools</li>
                  <li>Analyze user engagement for better experience</li>
                  <li>Comply with legal obligations</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  If you join our waitlist, we&apos;ll only use your email to contact you
                  about Brancr updates — no spam, ever.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  4. How We Share Your Information
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not sell your personal data.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may share limited information with:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>
                    Service providers (e.g., hosting, analytics, email delivery
                    services like Resend or Supabase)
                  </li>
                  <li>Legal authorities if required by law</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  All partners are required to maintain strong data protection
                  standards.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  5. Data Retention and Security
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We keep your information only as long as necessary for the purpose
                  collected.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We implement administrative, technical, and physical safeguards to
                  protect your data against unauthorized access or misuse. However, no
                  online service is 100% secure, so please use Brancr responsibly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
                <p className="text-gray-700 leading-relaxed mb-4">You may:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>Request a copy of your stored data</li>
                  <li>Request deletion of your information</li>
                  <li>Unsubscribe from all communications</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  To make a request, contact us at{" "}
                  <a
                    href="mailto:privacy@brancr.com"
                    className="text-accent hover:underline"
                  >
                    privacy@brancr.com
                  </a>
                  .
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Third-Party Links
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Brancr may contain links to third-party sites (e.g., Meta, TikTok,
                  X). We are not responsible for their privacy practices — please
                  review their policies separately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. International Users
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Brancr operates primarily in Nigeria and Sub-Saharan Africa, but our
                  infrastructure may process data internationally. By using Brancr, you
                  consent to this transfer.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Updates to This Policy
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may update this Privacy Policy periodically. The &quot;Last Updated&quot;
                  date will always reflect the current version.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Significant changes will be communicated via email or site banner.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions or concerns about this Privacy Policy,
                  contact us at:
                </p>
                <p className="text-gray-700 leading-relaxed">
                  📧{" "}
                  <a
                    href="mailto:privacy@brancr.com"
                    className="text-accent hover:underline"
                  >
                    privacy@brancr.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}


"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "What is Brancr?",
    answer:
      "Brancr is an AI-powered marketing assistant built for small and growing businesses in Africa. It helps you automate your social media replies, create and schedule posts, and track performance — all from a simple chat interface.",
  },
  {
    question: "Is Brancr available now?",
    answer:
      "Not yet! Brancr is currently in its private beta phase. You can join our waitlist to be among the first to get access when we launch publicly.",
  },
  {
    question: "What happens when I join the waitlist?",
    answer:
      "When you sign up, your email is securely stored in our waitlist database. Once we open early access, you'll receive an exclusive invite — plus a 50% early-bird discount for the first 6 months of use.",
  },
  {
    question: "Who can use Brancr?",
    answer:
      "Brancr is designed for SMEs, e-commerce brands, creators, and service providers who manage multiple social media platforms and want to grow faster with less effort.",
  },
  {
    question: "How does Brancr work?",
    answer:
      "You connect your social media accounts (like Facebook, Instagram, X, or TikTok), then chat with your AI assistant through a simple app — just send photos, videos, or ideas. Brancr writes, schedules, and replies for you automatically.",
  },
  {
    question: "Do I need any technical skills to use Brancr?",
    answer:
      "Not at all. If you can send a message on WhatsApp, you can use Brancr. It's built for simplicity — no dashboards, no spreadsheets, just chat.",
  },
  {
    question: "Will Brancr replace human social media managers?",
    answer:
      "No. Brancr is an assistant, not a replacement. It handles repetitive tasks like replying to FAQs or generating captions, but you still approve posts and handle high-value customer interactions.",
  },
  {
    question: "How much will Brancr cost?",
    answer:
      "Final pricing will be announced at launch, but we're designing flexible plans to fit small and growing businesses — and everyone on the waitlist gets 50% off for the first 6 months.",
  },
  {
    question: "What platforms does Brancr work with?",
    answer:
      "Brancr will initially integrate with Instagram, Facebook, X (Twitter), TikTok, and WhatsApp, with support for Google Business and LinkedIn coming soon.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Absolutely. We use end-to-end encryption and host all data on secure, compliant servers. Your business messages and credentials are never shared or sold.",
  },
  {
    question: "How can I contact the Brancr team?",
    answer:
      "You can email us anytime at contact@brancr.com or reach out via WhatsApp (once live). You can also follow our updates on LinkedIn and Instagram.",
  },
  {
    question: "Can I become a beta tester or partner?",
    answer:
      "Yes — if you join the waitlist, we'll invite selected businesses to join our private beta before public launch. Early testers help shape Brancr and get extended discounts and perks.",
  },
  {
    question: "When is the official launch?",
    answer:
      "We're currently onboarding early users and improving our AI engine. The official public launch is planned for Q1 2026. Sign up now to stay ahead.",
  },
  {
    question: "Can I unsubscribe from the waitlist later?",
    answer:
      "Yes, of course. Every email we send includes an unsubscribe link, and you can contact us anytime to remove your data.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-dark-bg"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto">
            Everything you need to know about Brancr
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset dark:hover:bg-dark-elevated transition-colors"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary pr-4">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <svg
                    className="w-5 h-5 text-accent dark:text-accent-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    id={`faq-answer-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-0">
                      <p className="text-gray-600 dark:text-dark-text-secondary leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


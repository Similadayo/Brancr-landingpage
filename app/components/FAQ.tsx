"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "What is Brancr?",
    answer: "Brancr is an AI-powered marketing assistant built for small and growing businesses in Africa. It helps you automate your social media replies, create and schedule posts, and track performance — all from a simple chat interface.",
  },
  {
    question: "Is Brancr available now?",
    answer: "Not yet! Brancr is currently in its private beta phase. You can join our waitlist to be among the first to get access when we launch publicly.",
  },
  {
    question: "What happens when I join the waitlist?",
    answer: "When you sign up, your email is securely stored in our waitlist database. Once we open early access, you'll receive an exclusive invite — plus a 50% early-bird discount for the first 6 months of use.",
  },
  {
    question: "Who can use Brancr?",
    answer: "Brancr is designed for SMEs, e-commerce brands, creators, and service providers who manage multiple social media platforms and want to grow faster with less effort.",
  },
  {
    question: "How does Brancr work?",
    answer: "You connect your social media accounts (like Facebook, Instagram, X, or TikTok), then chat with your AI assistant through a simple app — just send photos, videos, or ideas. Brancr writes, schedules, and replies for you automatically.",
  },
  {
    question: "Do I need any technical skills?",
    answer: "Not at all. If you can send a message on WhatsApp, you can use Brancr. It's built for simplicity — no dashboards, no spreadsheets, just chat.",
  },
  {
    question: "Will Brancr replace human managers?",
    answer: "No. Brancr is an assistant, not a replacement. It handles repetitive tasks like replying to FAQs or generating captions, but you still approve posts and handle high-value interactions.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-dark-bg transition-colors duration-300 relative border-t border-gray-100 dark:border-white/5">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"></span>
            KNOWLEDGE BASE
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to know about the platform.
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
              className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:border-accent-200 dark:hover:border-white/20 transition-colors"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-start justify-between focus:outline-none"
              >
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white pr-8 leading-snug">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 mt-1 text-gray-400 dark:text-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-200 dark:border-white/5 pt-4">
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

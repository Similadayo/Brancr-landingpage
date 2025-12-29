"use client";

import { motion } from "framer-motion";

export default function Escalation() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-bg dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              AI That Knows Its Limits
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              Brancr isn&apos;t a faceless bot; it&apos;s a smart assistant that handles
              the repetitive, not the risky.
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              You&apos;re instantly alerted in chat whenever:
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-accent dark:text-accent-400 mt-1">•</span>
                <span>A message is too complex for AI.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent dark:text-accent-400 mt-1">•</span>
                <span>A customer wants a discount or negotiation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent dark:text-accent-400 mt-1">•</span>
                <span>A payment or booking needs your approval.</span>
              </li>
            </ul>
            <p className="text-lg text-gray-700 dark:text-gray-200 font-medium">
              You stay in control — the AI just makes your work faster, not
              harder.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-light dark:from-white dark:to-gray-200 flex items-center justify-center text-white dark:text-gray-900 font-bold">
                    AI
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      &quot;What are your opening hours?&quot;
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 justify-end">
                  <div className="flex-1 bg-accent dark:bg-white text-white dark:text-gray-900 rounded-lg p-4 text-sm">
                    We&apos;re open Monday to Friday, 9 AM - 6 PM. How can I help you
                    today?
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500 dark:bg-orange-600 flex items-center justify-center text-white font-bold">
                    ⚠
                  </div>
                  <div className="flex-1 bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-1">
                      Needs Your Attention
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      Customer requesting 50% discount on bulk order
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


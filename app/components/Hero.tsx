"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-white via-neutral-bg to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent-light/5"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight"
          >
            Brancr: The{" "}
            <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
              AI Marketing Assistant
            </span>{" "}
            for Growing African SMEs
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Stop losing sales in your DMs. Brancr helps you manage your
            content, comments, and customer chats—all from one simple chat
            interface.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link
              href="/waitlist"
              className="bg-accent text-white px-8 py-4 rounded-lg font-semibold text-base hover:bg-accent/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Join Waitlist
            </Link>
            <Link
              href="#features"
              className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg font-semibold text-base border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all w-full sm:w-auto"
            >
              Learn More
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-gray-500 dark:text-gray-300"
          >
            <p>
              No credit card required • Works with Facebook, Instagram, TikTok,
              WhatsApp, and X
            </p>
          </motion.div>
        </div>

        {/* Visual Mockup Area */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 relative"
        >
          <div className="bg-gradient-to-br from-accent/10 to-accent-light/10 dark:from-accent/5 dark:to-accent-light/5 rounded-2xl p-8 border border-accent/20 dark:border-accent/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone Mockup */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-light"></div>
                      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          &quot;Do you have this in stock?&quot;
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 justify-end">
                      <div className="flex-1 bg-accent text-white rounded-lg p-3 text-sm">
                        Yes! We have it available. Would you like to place an
                        order?
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-300 text-center">
                  AI-powered chat interface
                </div>
              </div>

              {/* Analytics Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Conversions</span>
                    <span className="text-lg font-bold text-accent">+47%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-accent to-accent-light w-3/4"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Response Time</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      &lt; 2 seconds
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


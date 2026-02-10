"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const benefits = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Limited Beta",
    desc: "Slots available for SMEs in Africa"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    title: "Exclusive Access",
    desc: "Test new features before public release"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "50% Discount",
    desc: "Founder pricing for your first 6 months"
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "Priority Feedback",
    desc: "Influence product direction directly"
  }
];

export default function EarlyAccess() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-dark-bg relative overflow-hidden transition-colors duration-300">

      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-100 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20 text-accent-700 dark:text-accent-300 text-xs font-mono mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-600 dark:bg-accent-400 animate-pulse"></span>
            SPOTS FILLING FAST
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Join Early Access & <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-cyan-500 dark:from-accent-400 dark:to-cyan-400">Save 50% at Launch</span>
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Be among the first to experience Brancr — the AI workforce that turns
            your social chats into conversions while you sleep.
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10 text-left shadow-lg dark:shadow-none hover:border-accent-300 dark:hover:border-white/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-50 dark:bg-accent-500/20 flex items-center justify-center text-accent-600 dark:text-accent-400 mb-4 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold mb-1">{benefit.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
                  {benefit.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <Link
            href="/waitlist"
            className="group relative inline-flex items-center gap-2 px-10 py-5 bg-accent-600 hover:bg-accent-700 text-white font-bold rounded-xl text-lg transition-all shadow-[0_4px_20px_rgba(99,91,255,0.4)] hover:shadow-[0_4px_30px_rgba(99,91,255,0.6)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative z-10 flex items-center gap-2">
              Join the Brancr Launch List
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </span>
          </Link>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              No credit card required
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Instant confirmation</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

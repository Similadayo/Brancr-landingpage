"use client";

import { motion } from "framer-motion";

const steps = [
  {
    phase: "01",
    title: "Connect",
    description: "Link your WhatsApp Business, Instagram, and Facebook pages in one click.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    phase: "02",
    title: "Train",
    description: "Upload your product catalog or website. Brancr learns your prices and policies instantly.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    phase: "03",
    title: "Automate",
    description: "Go live. The AI starts handling chats, taking orders, and scheduling posts.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-gray-50 dark:bg-dark-bg overflow-hidden transition-colors duration-300">

      {/* Animated Pipeline Line (Desktop) */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-white/5 hidden md:block -translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Setup in <span className="text-accent-600 dark:text-accent-400">Minutes</span>, Not Weeks
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              {/* Connector Dot */}
              <div className="hidden md:block absolute top-[calc(50%-4rem)] left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-50 dark:bg-dark-bg border-2 border-accent-500 rounded-full z-20">
                <div className="absolute inset-0 bg-accent-500 rounded-full animate-ping opacity-75"></div>
              </div>

              <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 p-8 rounded-2xl relative z-10 hover:border-accent-400 dark:hover:border-accent-500/50 transition-colors group shadow-lg dark:shadow-none overflow-hidden sm:overflow-visible">
                <div className="text-4xl sm:text-6xl font-black text-gray-100 dark:text-white/5 absolute top-4 right-4 sm:-top-6 sm:-right-6 z-0 group-hover:text-accent-100 dark:group-hover:text-accent-500/10 transition-colors select-none pointer-events-none">
                  {step.phase}
                </div>

                <div className="w-14 h-14 bg-accent-50 dark:bg-accent-600/20 rounded-xl flex items-center justify-center text-accent-600 dark:text-accent-400 mb-6 relative z-10 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 relative z-10">
                  {step.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed relative z-10">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

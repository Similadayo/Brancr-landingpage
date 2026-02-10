"use client";

import { motion } from "framer-motion";

const features = [
  {
    category: "AI Sales Agent",
    title: "Turn DMs Into Dollars",
    description: "Your AI agent handles inquiries, negotiates prices within your limits, and closes sales automatically.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: "from-purple-500 to-indigo-500",
  },
  {
    category: "Social Automation",
    title: "Post While You Sleep",
    description: "Upload product photos, and Brancr writes captions, picks hashtags, and schedules posts to IG, TikTok & FB.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "from-pink-500 to-rose-500",
  },
  {
    category: "Business Logic",
    title: "Smart Operations",
    description: "Built-in inventory tracking and delivery fee calculation based on location. No more manual math.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2m0 0a2 2 0 012 2v0a2 2 0 012-2" />
      </svg>
    ),
    color: "from-cyan-400 to-blue-500",
  },
  {
    category: "Payments",
    title: "Instant Payments",
    description: "Generated Paystack links sent directly in chat. Verify payments automatically before confirming orders.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    color: "from-emerald-400 to-green-500",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-dark-bg transition-colors duration-300">

      {/* Background Decor */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-accent-100 dark:bg-accent-900/10 rounded-full blur-[120px] pointer-events-none opacity-50 dark:opacity-100"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-100 dark:bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none opacity-50 dark:opacity-100"></div>

      <div className="max-w-7xl mx-auto relative z-10">

        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-cyan-500 dark:from-accent-400 dark:to-cyan-400">Complete OS</span> for <br /> Social Commerce
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Replace your chaotic DMs, spreadsheets, and manual invoices with one intelligent system.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden hover:border-accent-200 dark:hover:border-white/20 transition-all shadow-lg dark:shadow-none"
            >
              {/* Hover Glow Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} p-[1px] mb-6 shadow-sm dark:shadow-glow`}>
                  <div className="w-full h-full rounded-2xl bg-gray-50 dark:bg-dark-evalated flex items-center justify-center bg-white dark:bg-black/40 backdrop-blur-md">
                    <div className="text-gray-900 dark:text-white">
                      {feature.icon}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-mono text-accent-600 dark:text-accent-300 mb-2 uppercase tracking-widest opacity-80 font-bold">
                  {feature.category}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-accent-600 dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-white dark:group-hover:to-gray-400 transition-all">
                  {feature.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 leading-relaxed group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

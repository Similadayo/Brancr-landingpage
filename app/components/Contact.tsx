"use client";

import { motion } from "framer-motion";

export default function Contact() {
  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-dark-bg transition-colors duration-300 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent-200/20 dark:bg-accent-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-100 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20 text-accent-700 dark:text-accent-300 text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-accent-600 dark:bg-accent-400 animate-pulse"></span>
            HUMAN SUPPORT
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Get in Touch
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Have questions about enterprise plans or custom integrations?
            Our neural network (and human team) is ready to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-dark-surface p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none hover:border-accent-300 dark:hover:border-white/20 transition-colors group"
          >
            <div className="w-12 h-12 bg-accent-50 dark:bg-accent-600/20 rounded-xl flex items-center justify-center text-accent-600 dark:text-accent-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email Us</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">For general inquiries and support.</p>
            <a href="mailto:contact@brancr.com" className="text-accent-600 dark:text-accent-400 font-medium hover:underline text-lg">
              contact@brancr.com
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-dark-surface p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none hover:border-accent-300 dark:hover:border-white/20 transition-colors group"
          >
            <div className="w-12 h-12 bg-accent-50 dark:bg-accent-600/20 rounded-xl flex items-center justify-center text-accent-600 dark:text-accent-400 mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Office</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Come visit our HQ.</p>
            <address className="text-gray-700 dark:text-gray-300 not-italic leading-relaxed">
              Brancr AI Technologies<br />
              6 Casco Street, Agboju Amuwo<br />
              Lagos, Nigeria
            </address>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

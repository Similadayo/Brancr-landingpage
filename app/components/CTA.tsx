"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-primary-dark to-gray-900">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Stop Managing Social Media and Start Growing?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of forward-thinking business owners already preparing
            for the Brancr launch.
          </p>
          <Link
            href="/waitlist"
            className="inline-block bg-accent text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-accent/90 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 mb-4"
          >
            Join the Waitlist Now
          </Link>
          <p className="text-white/80 text-sm">
            Be first to experience the AI-powered growth engine for African
            SMEs.
          </p>
        </motion.div>
      </div>
    </section>
  );
}


"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function EarlyAccess() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-primary-dark to-primary">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Join Brancr Early Access & Save 50% When We Launch
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Be among the first to experience Brancr — the AI tool that turns
            your social chats into conversions and automates your content
            creation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="text-2xl mb-2">🔓</div>
              <p className="text-white font-semibold mb-1">Limited Beta</p>
              <p className="text-white/80 text-xs">
                Slots available for SMEs in Africa
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="text-2xl mb-2">💬</div>
              <p className="text-white font-semibold mb-1">Exclusive Access</p>
              <p className="text-white/80 text-xs">
                Test new features before public release
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="text-2xl mb-2">💰</div>
              <p className="text-white font-semibold mb-1">50% Discount</p>
              <p className="text-white/80 text-xs">
                Founder pricing for your first 6 months
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="text-2xl mb-2">📈</div>
              <p className="text-white font-semibold mb-1">Priority Feedback</p>
              <p className="text-white/80 text-xs">
                Influence product direction
              </p>
            </div>
          </div>

          <Link
            href="/waitlist"
            className="inline-block bg-accent text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-accent/90 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 mb-4"
          >
            Join the Brancr Launch List
          </Link>
          <p className="text-white/80 text-sm mb-4">
            No credit card required • Instant confirmation after signup
          </p>
          <p className="text-white/70 text-xs italic">
            Secure your early access now — invitations close soon.
          </p>
        </motion.div>
      </div>
    </section>
  );
}


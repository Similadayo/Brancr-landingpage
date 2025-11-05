"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Convert Conversations Into Customers",
    problem: "You're getting messages every day, but can't reply fast enough.",
    solution:
      "Brancr's AI Chat-to-Sale Engine instantly responds to DMs and comments, qualifies leads, and guides buyers — while sounding naturally human.",
    result: "You never miss a lead again.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    title: "Create & Post in Seconds",
    problem: "Writing captions, picking hashtags, and posting manually wastes hours.",
    solution:
      "Just send your photo or video to Brancr. Your AI assistant writes captions, recommends hashtags, and schedules across platforms in one tap.",
    result: "A week's content done in an hour.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: "Know What Works — and What Doesn't",
    problem: "You're posting daily but have no clue which posts drive real sales.",
    solution:
      "Brancr sends you a weekly performance snapshot inside your chat app — showing what's converting and what to improve next.",
    result: "Data-driven growth made simple.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            All the Tools you need to help
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your social media, engage customers, and grow your business—all in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-accent/10 to-accent-light/10 rounded-lg flex items-center justify-center text-accent mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Problem:
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.problem}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Solution:
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.solution}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-accent mb-1">
                    Result:
                  </p>
                  <p className="text-gray-700 text-sm font-medium leading-relaxed">
                    {feature.result}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


"use client";

import { motion } from "framer-motion";

const feedbacks = [
  {
    quote:
      "The Telegram-style interface is so simple — I never thought AI could feel this natural.",
    author: "Early Pilot User",
    location: "Lagos",
    avatar: "EP",
  },
  {
    quote:
      "It's like having a digital marketing assistant in my pocket. Every reply is fast, accurate, and on brand.",
    author: "Beta Partner",
    location: "Accra",
    avatar: "BP",
  },
  {
    quote:
      "Brancr makes handling customer chats as easy as texting a friend.",
    author: "Boutique Owner",
    location: "Abuja",
    avatar: "BO",
  },
];

export default function Feedback() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Built with Real African Businesses
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Brancr is being tested by real SMEs across Nigeria and Ghana.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {feedbacks.map((feedback, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                &quot;{feedback.quote}&quot;
              </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white font-semibold text-sm">
                    {feedback.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {feedback.author}
                    </p>
                    <p className="text-sm text-gray-600">{feedback.location}</p>
                  </div>
                </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


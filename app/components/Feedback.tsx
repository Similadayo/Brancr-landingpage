"use client";

import { motion } from "framer-motion";

const feedbacks = [
  {
    quote: "The Telegram-style interface is so simple — I never thought AI could feel this natural.",
    author: "Chioma A.",
    role: "Fashion Retailer",
    location: "Lagos",
    initials: "CA",
    color: "bg-purple-500"
  },
  {
    quote: "It's like having a digital marketing assistant in my pocket. Every reply is fast, accurate, and on brand.",
    author: "Kwame O.",
    role: "Electronics Dealer",
    location: "Accra",
    initials: "KO",
    color: "bg-blue-500"
  },
  {
    quote: "Brancr makes handling customer chats as easy as texting a friend. My sales have doubled.",
    author: "Zainab M.",
    role: "Beauty Vendor",
    location: "Abuja",
    initials: "ZM",
    color: "bg-pink-500"
  },
];

export default function Feedback() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-dark-bg transition-colors duration-300 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-200/20 dark:bg-accent-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-100 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20 text-accent-700 dark:text-accent-300 text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            PILOT FEEDBACK
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Trusted by Modern <span className="text-accent-600 dark:text-accent-400">African Businesses</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Brancr is already helping SMEs across Nigeria and Ghana automate their sales.
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
              className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-lg dark:shadow-none border border-gray-200 dark:border-white/10 hover:border-accent-300 dark:hover:border-white/20 transition-all group"
            >
              {/* Quote Icon */}
              <div className="mb-6 text-accent-200 dark:text-accent-500/20 group-hover:text-accent-500 dark:group-hover:text-accent-400 transition-colors">
                <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                  <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                </svg>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed text-lg font-medium">
                &ldquo;{feedback.quote}&rdquo;
              </p>

              <div className="flex items-center gap-4 mt-auto">
                <div className={`w-12 h-12 rounded-full ${feedback.color} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                  {feedback.initials}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">
                    {feedback.author}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {feedback.role}, {feedback.location}
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

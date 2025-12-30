"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "1",
    title: "Connect",
    whatYouDo: "Link your social accounts and connect Brancr once.",
    whatYouGet: "Setup takes minutes.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  },
  {
    number: "2",
    title: "Chat & Create",
    whatYouDo:
      "Send media to your chat assistant — Brancr writes, optimizes, and schedules your post.",
    whatYouGet: "Create content effortlessly.",
    icon: (
      <svg
        className="w-6 h-6"
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
    number: "3",
    title: "Approve & Relax",
    whatYouDo:
      "Approve replies and posts in one tap. Brancr handles the rest.",
    whatYouGet: "Growth on autopilot.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-accent/5 to-white dark:from-dark-bg dark:via-accent/10 dark:to-dark-bg">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-dark-text-primary mb-4">
            How It Works
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-dark-border">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-accent to-accent-light dark:from-dark-accent-primary dark:to-[#6BB8FF] rounded-full flex items-center justify-center text-white dark:text-white text-2xl font-bold">
                  {step.number}
                </div>
                <div className="w-12 h-12 mx-auto mb-4 text-accent dark:text-dark-accent-primary text-center">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-4 text-center">
                  {step.title}
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                      What You Do:
                    </p>
                    <p className="text-gray-600 dark:text-dark-text-secondary text-sm">{step.whatYouDo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-accent dark:text-dark-accent-primary mb-1">
                      What You Get:
                    </p>
                    <p className="text-gray-700 dark:text-dark-text-primary text-sm font-medium">
                      {step.whatYouGet}
                    </p>
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-accent to-accent-light dark:from-dark-accent-primary dark:to-[#6BB8FF] transform -translate-y-1/2"></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


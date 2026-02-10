"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";

// Simulated Chat Data
const chatFlow = [
  { sender: "user", text: "Do you have those velvet storage boxes?", delay: 1000 },
  { sender: "agent", text: "Typing...", type: "typing", delay: 2000 },
  { sender: "agent", text: "Yes! We have Red and Deep Blue available. ₦25,000 per set.", type: "message", delay: 3000 },
  { sender: "user", text: "Can I get a discount for 3 sets?", delay: 4500 },
  { sender: "agent", text: "Typing...", type: "typing", delay: 5500 },
  { sender: "agent", text: "I can do ₦22,000 each if you buy 3 today. Deal?", type: "message", delay: 6500 },
  { sender: "user", text: "Deal! Send the payment link.", delay: 8000 },
  { sender: "system", text: "Order Created Setup", type: "system", delay: 9000 },
  { sender: "agent", text: "Great choice! Here's your invoice for ₦66,000.", type: "message", link: "Pay Now", delay: 10000 },
];

const FloatingParticles = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-xl"
          style={{
            width: Math.random() * 300 + 50,
            height: Math.random() * 300 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const ChatSimulation = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];

    const runSimulation = () => {
      setMessages([]);
      setIsTyping(false);

      chatFlow.forEach((step) => {
        const timeout = setTimeout(() => {
          if (step.type === "typing") {
            setIsTyping(true);
          } else {
            setIsTyping(false);
            setMessages((prev) => [...prev, step]);
          }
        }, step.delay);
        timeouts.push(timeout);
      });

      // Reset Loop
      const resetTimeout = setTimeout(() => {
        runSimulation();
      }, 14000);
      timeouts.push(resetTimeout);
    };

    runSimulation();

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full max-w-[320px] sm:max-w-sm mx-auto bg-white dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl dark:shadow-none overflow-hidden flex flex-col h-[420px] sm:h-[500px] max-h-[70vh] sm:max-h-none transition-colors duration-300">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-500 to-cyan-400 p-[2px]">
          <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center">
            <span className="text-accent-600 dark:text-white font-bold text-xs">AI</span>
          </div>
        </div>
        <div>
          <div className="text-gray-900 dark:text-white font-medium text-sm">Brancr Sales AI</div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-600 dark:text-green-400">Online & Selling</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 sm:p-4 space-y-4 overflow-y-auto no-scrollbar scroll-smooth bg-white dark:bg-transparent">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.type === "system" ? (
                <div className="w-full flex justify-center my-2">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono bg-gray-100 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                    {msg.text}
                  </span>
                </div>
              ) : (
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === "user"
                    ? "bg-accent-600 text-white rounded-tr-sm"
                    : "bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-tl-sm"
                    }`}
                >
                  {msg.text}
                  {msg.link && (
                    <div className="mt-2">
                      <button className="w-full py-2 bg-white text-accent-600 dark:bg-accent-500 dark:text-white text-xs font-bold rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-accent-600">
                        {msg.link}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center w-16 h-10">
              <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-2 sm:p-3 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10">
        <div className="h-9 sm:h-10 bg-white dark:bg-black/20 rounded-full border border-gray-200 dark:border-white/10 flex items-center px-4 text-xs text-gray-400 dark:text-gray-500 shadow-sm dark:shadow-none">
          Type a message...
        </div>
      </div>
    </div>
  );
};

export default function Hero() {
  return (
    <section className="relative lg:min-h-screen pt-24 sm:pt-28 pb-16 sm:pb-20 overflow-hidden flex flex-col justify-center bg-gray-50 dark:bg-dark-bg transition-colors duration-300">

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white dark:from-primary-900/40 dark:via-dark-bg dark:to-dark-bg transition-colors duration-500"></div>
        <FloatingParticles />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left Column: Copy */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-50 border border-accent-200 text-accent-700 dark:bg-accent-500/10 dark:border-accent-500/20 dark:text-accent-300 text-xs font-mono mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-accent-600 dark:bg-accent-400 animate-pulse"></span>
              AI PIPELINE ACTIVE
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 leading-[1.1]"
            >
              Your New <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 via-cyan-600 to-accent-600 dark:from-accent-400 dark:via-cyan-400 dark:to-accent-400 animate-text-shimmer bg-[length:200%_auto]">
                AI Sales Employee
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light"
            >
              Takes orders, negotiates prices, and closes deals in your DMs 24/7.
              Stop leaving money on the table while you sleep.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/waitlist"
                className="group relative px-8 py-4 w-full sm:w-auto bg-accent-600 hover:bg-accent-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl dark:shadow-[0_0_20px_rgba(99,91,255,0.3)] dark:hover:shadow-[0_0_40px_rgba(99,91,255,0.5)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative z-10 flex items-center gap-2">
                  Get Early Access
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </span>
              </Link>
              <button className="px-8 py-4 w-full sm:w-auto bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white font-medium rounded-xl transition-all flex items-center gap-2 backdrop-blur-sm group shadow-sm hover:shadow-md dark:shadow-none">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-3 h-3 text-gray-700 dark:text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 pt-8 border-t border-gray-200 dark:border-white/5 flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-8"
            >
              {['WhatsApp', 'Instagram', 'Facebook', 'TikTok'].map((platform) => (
                <span key={platform} className="text-gray-500 dark:text-gray-500 text-sm font-medium hover:text-accent-600 dark:hover:text-white transition-colors cursor-default">
                  {platform}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Chat Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 w-full max-w-md lg:max-w-full flex justify-center lg:justify-end relative"
          >
            {/* Glow Effect behind phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent-200/40 dark:bg-accent-600/20 blur-[100px] rounded-full -z-10"></div>

            <ChatSimulation />

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 top-20 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl hidden md:block"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Conversion Rate</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">+47%</div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

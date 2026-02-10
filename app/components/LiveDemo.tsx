"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const scenarios = [
    { id: "price", label: "Ask Price", user: "How much is the iPhone 15?", ai: "The iPhone 15 is ₦1,200,000. We have Blue and Black in stock. Want to see photos?" },
    { id: "negotiate", label: "Negotiate", user: "Can I pay ₦1,100,000?", ai: "I can't go that low, but I can do ₦1,150,000 if you order right now. Deal?" },
    { id: "delivery", label: "Check Delivery", user: "Do you deliver to Abuja?", ai: "Yes! Delivery to Abuja is ₦4,500 and takes 2-3 days. Should I add that to your order?" },
];

export default function LiveDemo() {
    const [activeScenario, setActiveScenario] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [response, setResponse] = useState<string | null>(null);

    const playScenario = (id: string) => {
        setActiveScenario(id);
        setResponse(null);
        setIsTyping(true);

        // Simulate AI thinking time
        setTimeout(() => {
            setIsTyping(false);
            const scenario = scenarios.find(s => s.id === id);
            if (scenario) setResponse(scenario.ai);
        }, 1500);
    };

    return (
        <section id="demo" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-dark-bg relative transition-colors duration-300">
            <div className="max-w-4xl mx-auto text-center mb-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-block px-4 py-1.5 rounded-full border border-accent-200 dark:border-accent-500/30 bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-300 text-sm font-medium mb-6"
                >
                    INTERACTIVE DEMO
                </motion.div>

                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                    See How It Handles <span className="text-accent-600 dark:text-accent-400">Real Customers</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Click a customer message to see how Brancr&apos;s AI responds instantly.
                </p>
            </div>

            <div className="max-w-xl mx-auto">
                <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden transition-colors duration-300">

                    {/* Scenario Buttons */}
                    <div className="flex flex-wrap gap-3 justify-center mb-8">
                        {scenarios.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => playScenario(s.id)}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeScenario === s.id
                                        ? "bg-accent-600 text-white scale-105 shadow-md"
                                        : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Chat Window */}
                    <div className="bg-gray-50 dark:bg-black/40 rounded-2xl p-4 min-h-[220px] sm:min-h-[250px] flex flex-col justify-end space-y-4 border border-gray-200 dark:border-white/5 transition-colors duration-300">
                        <AnimatePresence mode="wait">
                            {activeScenario && (
                                <motion.div
                                    key={activeScenario + "-user"}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex justify-end"
                                >
                                    <div className="bg-accent-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-sm">
                                        {scenarios.find(s => s.id === activeScenario)?.user}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white dark:bg-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 border border-gray-200 dark:border-white/5 shadow-sm">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {response && (
                                <motion.div
                                    key={activeScenario + "-ai"}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white dark:bg-white/10 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-sm leading-relaxed border border-gray-200 dark:border-white/5 shadow-sm">
                                        {response}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!activeScenario && !isTyping && !response && (
                            <div className="text-center text-gray-400 text-sm py-8">
                                Select a scenario above to start the demo...
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </section>
    );
}

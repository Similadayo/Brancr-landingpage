"use client";

import { motion } from "framer-motion";

const specs = [
    {
        label: "Context Window",
        value: "8k Tokens",
        desc: "Remembers conversation history, customer preferences, and past orders.",
        color: "text-accent-600 dark:text-accent-400",
    },
    {
        label: "Response Latency",
        value: "< 1.5s",
        desc: "Optimized for varying network conditions across Africa (2G/3G/4G).",
        color: "text-green-600 dark:text-green-400",
    },
    {
        label: "Sentiment Engine",
        value: "V4.2",
        desc: "Detects frustration and auto-escalates to human agents instantly.",
        color: "text-cyan-600 dark:text-cyan-400",
    },
    {
        label: "Inventory Sync",
        value: "Real-time",
        desc: "Prevents overselling by checking stock levels before confirming orders.",
        color: "text-purple-600 dark:text-purple-400",
    },
];

export default function TechSpecs() {
    return (
        <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-dark-bg border-y border-gray-200 dark:border-white/5 relative overflow-hidden transition-colors duration-300">

            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row gap-16 items-center">

                    {/* Left: Text */}
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-mono mb-6"
                        >
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            SYSTEM ARCHITECTURE
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6"
                        >
                            Built on <span className="text-accent-600 dark:text-accent-400">Advanced AI</span> Infrastructure
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8"
                        >
                            Brancr isn&apos;t just a chatbot. It&apos;s a vertically integrated commerce engine that understands context, intent, and business logic.
                        </motion.p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {specs.map((spec, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 + (i * 0.1) }}
                                    className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <div className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1">{spec.label}</div>
                                    <div className={`text-xl font-mono font-bold ${spec.color} mb-2`}>{spec.value}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{spec.desc}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Visual */}
                    <div className="flex-1 w-full relative">
                        <div className="relative aspect-[4/5] sm:aspect-square max-w-[360px] sm:max-w-[500px] mx-auto">
                            {/* Central Brain/Node */}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>

                            {/* Terminal Component - Keeping it Dark for "Code" feel */}
                            <div className="absolute inset-4 bg-[#1E1E1E] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                                {/* Mock Terminal Header */}
                                <div className="bg-[#2D2D2D] border-b border-gray-700 p-2.5 sm:p-3 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                    <div className="ml-2 text-xs text-gray-400 font-mono">core/decision_engine.go</div>
                                </div>

                                {/* Code/Log Stream */}
                                <div className="flex-1 p-3 sm:p-4 font-mono text-[10px] sm:text-xs text-gray-400 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1E1E1E] z-10"></div>
                                    <div className="space-y-2 opacity-70">
                                        <div className="flex gap-2"><span className="text-green-400">[INFO]</span> <span>New Message Received: &quot;How much for delivery to Abuja?&quot;</span></div>
                                        <div className="flex gap-2"><span className="text-purple-400">[ANALYSIS]</span> <span>Intent: DELIVERY_INQUIRY (Confidence: 0.98)</span></div>
                                        <div className="flex gap-2"><span className="text-purple-400">[EXTRACT]</span> <span>Location: &quot;Abuja&quot; -&gt; Zone: North Central</span></div>
                                        <div className="flex gap-2"><span className="text-cyan-400">[LOGIC]</span> <span>Calculating fee... Base: ₦3500 + Weight: 1.2kg</span></div>
                                        <div className="flex gap-2"><span className="text-green-400">[ACTION]</span> <span>Drafting response with fee: ₦4,500</span></div>
                                        <div className="flex gap-2"><span className="text-blue-400">[MEMORY]</span> <span>Updating context: user_intent = PURCHASE_FLOW</span></div>
                                        <div className="flex gap-2"><span className="text-green-400">[SENT]</span> <span>Response dispatch -&gt; WhatsApp API (200 OK)</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

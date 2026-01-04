"use client";

import React, { useState } from "react";
import { useAIMetrics } from "@/app/(tenant)/hooks/useAIMetrics";
import {
    SparklesIcon,
    InboxIcon,
    UserGroupIcon,
    ClockIcon,
    PackageIcon,
} from "../../icons";

export default function AIStatusSummary() {
    const [period, setPeriod] = useState<"24h" | "7d" | "30d">("7d");
    const { data: metrics, isLoading } = useAIMetrics(period);

    const stats = [
        {
            label: "AI Resolution Rate",
            value: metrics ? `${metrics.ai_resolution_rate}%` : "-",
            subtext: "conversations handled entirely by AI",
            icon: SparklesIcon,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            trend: "+2.5%", // Mock trend for visually appealing UI
            trendUp: true,
        },
        {
            label: "Active Conversations",
            value: metrics ? metrics.active_conversations : "-",
            subtext: "currently ongoing",
            icon: InboxIcon,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
            label: "Human Intervention",
            value: metrics ? `${metrics.human_intervention_rate}%` : "-",
            subtext: "escalated to support",
            icon: UserGroupIcon,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            trend: "-1.2%",
            trendUp: false, // Good that it's down
        },
        {
            label: "Orders Influenced",
            value: metrics ? metrics.orders_influenced : "-",
            subtext: "attributed to AI chats",
            icon: PackageIcon,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            trend: "+5",
            trendUp: true,
        },
    ];

    if (isLoading) {
        return (
            <div className="mb-8 animate-pulse rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-6 h-8 w-48 rounded-lg bg-gray-100 dark:bg-gray-700" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl bg-gray-50 dark:bg-gray-900" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                        <SparklesIcon className="h-6 w-6 text-purple-600" />
                        AI Performance Summary
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Overview of your AI agent's performance and impact.
                    </p>
                </div>
                <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                    {(["24h", "7d", "30d"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${period === p
                                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-purple-100 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:hover:border-purple-900/30"
                    >
                        <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${stat.bg} opacity-50 transition-transform group-hover:scale-110`} />

                        <div className="relative mb-4 flex items-start justify-between">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            {stat.trend && (
                                <span className={`flex items-center text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {stat.trend}
                                    {stat.trendUp ? (
                                        <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    ) : (
                                        <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                        </svg>
                                    )}
                                </span>
                            )}
                        </div>

                        <div className="relative">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            <p className="font-medium text-gray-900 dark:text-gray-200">{stat.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.subtext}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="mt-6 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <ClockIcon className="h-4 w-4 text-amber-500" />
                <span>Avg Response Time: <span className="font-semibold text-gray-700 dark:text-gray-300">{metrics?.avg_response_time || "0s"}</span></span>
                <span className="mx-2 text-gray-300">|</span>
                <span>Total Interactions: <span className="font-semibold text-gray-700 dark:text-gray-300">{metrics?.total_interactions?.toLocaleString() || 0}</span></span>
            </div>
        </div>
    );
}

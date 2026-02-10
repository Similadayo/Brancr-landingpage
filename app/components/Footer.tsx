"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-8 md:mb-0">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo-dark.svg"
                                alt="Brancr"
                                width={120}
                                height={40}
                                className="h-8 w-auto dark:brightness-0 dark:invert"
                            />
                        </Link>
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                            Your AI Sales Employee. Automate your sales 24/7.
                        </p>
                    </div>

                    <div className="flex space-x-8">
                        <Link
                            href="#features"
                            className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors"
                        >
                            Features
                        </Link>
                        <Link
                            href="#about"
                            className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors"
                        >
                            About
                        </Link>
                        <Link
                            href="#contact"
                            className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors"
                        >
                            Contact
                        </Link>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-dark-border flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} Brancr. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link
                            href="/privacy"
                            className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-sm text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-dark.svg"
              alt="Brancr"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-gray-700 hover:text-primary transition-colors text-sm font-medium"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-gray-700 hover:text-primary transition-colors text-sm font-medium"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-gray-700 hover:text-primary transition-colors text-sm font-medium"
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/waitlist"
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      </nav>
    </motion.header>
  );
}


'use client';

import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

function BackgroundEffects() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [mounted, setMounted] = useState(false);

  // Smooth spring animation for mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Parallax transform values
  const moveX1 = useTransform(springX, [0, 1], [-20, 20]);
  const moveY1 = useTransform(springY, [0, 1], [-20, 20]);
  const moveX2 = useTransform(springX, [0, 1], [30, -30]);
  const moveY2 = useTransform(springY, [0, 1], [30, -30]);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to 0-1
      const { innerWidth, innerHeight } = window;
      mouseX.set(e.clientX / innerWidth);
      mouseY.set(e.clientY / innerHeight);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <>
      {/* Moving Auroras with Parallax */}
      <motion.div
        style={{ x: moveX1, y: moveY1 }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -top-[20%] -left-[20%] h-[80%] w-[80%] rounded-full bg-accent/30 blur-[100px]"
      />
      <motion.div
        style={{ x: moveX2, y: moveY2 }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[40%] -right-[20%] h-[60%] w-[60%] rounded-full bg-primary-400/20 blur-[120px]"
      />

      {/* Meteor / Shooting Stars */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`meteor-${i}`}
          initial={{ top: -100, left: Math.random() * 100 + "%", opacity: 1 }}
          animate={{ top: "100%", left: Math.random() * 100 + "%", opacity: 0 }}
          transition={{
            duration: Math.random() * 2 + 2,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear"
          }}
          style={{ position: 'absolute', width: '2px', height: '100px', background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.8))' }}
        />
      ))}

      {/* Floating Particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            opacity: Math.random() * 0.5 + 0.1
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2]
          }}
          transition={{
            duration: Math.random() * 5 + 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
    </>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-neutral-bg dark:bg-dark-bg transition-colors duration-300">
      <div className="flex min-h-screen w-full flex-col lg:flex-row shadow-2xl overflow-hidden">

        {/* Left Side - Visual (Desktop Only) */}
        <div className="relative hidden w-full lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between overflow-hidden bg-[#02010A] px-12 py-12 text-white">
          {/* Advanced Animated Background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Deep Space Base */}
            <div className="absolute inset-0 bg-[#02010A]"></div>

            {/* Interactive Auroras (Parallax) */}
            <BackgroundEffects />

            {/* Grain Overlay for Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            {/* Readability Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#02010A] via-[#02010A]/40 to-transparent opacity-80"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Link href="/" className="inline-block transition-transform duration-300 hover:scale-110">
                <Image
                  src="/logo-light.svg"
                  alt="Brancr"
                  width={48}
                  height={48}
                  className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                />
              </Link>
            </motion.div>

            <div className="flex flex-1 flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider backdrop-blur-md border border-white/20 mb-6 text-accent-100 shadow-glow">
                  Tenant Dashboard
                </span>
                <h2 className="text-4xl font-bold leading-tight xl:text-5xl text-balance drop-shadow-2xl text-white">
                  Automate your customer engagement with AI.
                </h2>
                <p className="mt-8 text-lg text-gray-300 max-w-md leading-relaxed">
                  Connect Instagram, Facebook, WhatsApp, and TikTok. Let our AI handle the conversations while you focus on growth.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-auto text-sm text-gray-400"
            >
              © {new Date().getFullYear()} Brancr Inc.
            </motion.div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-1 flex-col bg-white dark:bg-dark-surface transition-colors duration-300 relative z-10">
          {/* Mobile Header */}
          <header className="flex w-full items-center justify-between p-6 lg:hidden absolute top-0 left-0 right-0 z-20">
            <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
              <Image src="/logo-dark.svg" alt="Brancr" width={32} height={32} className="dark:brightness-0 dark:invert" />
              Brancr
            </Link>
          </header>

          <main className="flex flex-1 items-center justify-center p-6 sm:p-12 lg:p-24 overflow-y-auto">
            <div className="w-full max-w-md space-y-8">
              {children}
            </div>
          </main>

          {/* Footer Links (Mobile/Desktop) */}
          <footer className="py-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex justify-center gap-4 mb-2">
              <Link href="/privacy" className="hover:text-primary dark:hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary dark:hover:text-white transition-colors">Terms</Link>
              <Link href="/help" className="hover:text-primary dark:hover:text-white transition-colors">Help</Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}


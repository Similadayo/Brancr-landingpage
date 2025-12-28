import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Escalation from "../components/Escalation";
import HowItWorks from "../components/HowItWorks";
import Feedback from "../components/Feedback";
import EarlyAccess from "../components/EarlyAccess";
import CTA from "../components/CTA";
import FAQ from "../components/FAQ";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brancr Platform Overview",
  description:
    "Explore Brancr’s AI-powered automation platform for social messaging, campaigns, analytics, and integrations built for African SMEs.",
  openGraph: {
    title: "Brancr – AI Automation Platform",
    description:
      "Discover how Brancr helps teams manage omnichannel conversations, campaigns, and analytics for social platforms like WhatsApp, Instagram, and Facebook.",
    url: "https://brancr.com/home",
  },
};

export default function ProductHome() {
  return (
    <main className="min-h-screen bg-neutral-bg dark:bg-gray-700">
      <Header />
      <Hero />
      <Features />
      <Escalation />
      <HowItWorks />
      <Feedback />
      <EarlyAccess />
      <CTA />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  );
}


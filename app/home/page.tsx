import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import TechSpecs from "../components/TechSpecs";
import LiveDemo from "../components/LiveDemo";
import Feedback from "../components/Feedback";
import FAQ from "../components/FAQ";
import EarlyAccess from "../components/EarlyAccess";
import CTA from "../components/CTA";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brancr – Your AI Sales Employee",
  description:
    "Automate your sales with Brancr. Takes orders, negotiates prices, and manages social media 24/7.",
  openGraph: {
    title: "Brancr – AI Sales Employee",
    description:
      "Automate your sales with Brancr. Takes orders, negotiates prices, and manages social media 24/7.",
    url: "https://brancr.com",
    images: ["/og-image.png"],
  },
};

export default function ProductHome() {
  return (
    <main className="min-h-screen bg-dark-bg selection:bg-accent-500/30">
      <Header />
      <Hero />
      <TechSpecs />
      <Features />
      <HowItWorks />
      <Feedback />
      <LiveDemo />
      <FAQ />
      <EarlyAccess />
      <CTA />
      <Contact />
      <Footer />
    </main>
  );
}

import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Escalation from "./components/Escalation";
import HowItWorks from "./components/HowItWorks";
import Feedback from "./components/Feedback";
import EarlyAccess from "./components/EarlyAccess";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Brancr is an AI-powered marketing assistant that helps African SMEs automate social media replies, create content, and manage customer chats from one simple chat interface. Join the waitlist for 50% off early access.",
  openGraph: {
    title: "Brancr – AI Marketing Assistant for African SMEs",
    description: "Automate your social media replies, content creation, and customer engagement with Brancr. Join the waitlist today for 50% off early access.",
    url: "https://brancr.com",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Escalation />
      <HowItWorks />
      <Feedback />
      <EarlyAccess />
      <CTA />
      <Footer />
    </main>
  );
}


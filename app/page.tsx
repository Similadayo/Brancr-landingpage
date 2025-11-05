import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Escalation from "./components/Escalation";
import HowItWorks from "./components/HowItWorks";
import Feedback from "./components/Feedback";
import EarlyAccess from "./components/EarlyAccess";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

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


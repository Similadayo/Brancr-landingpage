import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brancr – AI Marketing Assistant for African SMEs",
  description: "Automate your social media replies, content creation, and customer engagement with Brancr. Join the waitlist today for 50% off early access.",
  keywords: [
    "AI marketing assistant for SMEs",
    "automate social media responses",
    "AI marketing tool Africa",
    "AI assistant for small business",
    "AI customer engagement Africa",
    "AI marketing chatbot",
    "automate social media marketing",
    "AI content scheduler",
    "simple AI marketing workflow",
    "AI marketing feedback Africa",
    "pilot SME AI marketing",
    "small business automation",
    "AI beta program Africa",
    "early access AI marketing tool",
    "SME automation software",
  ],
  openGraph: {
    title: "Brancr – AI Marketing Assistant for African SMEs",
    description: "Automate your social media replies, content creation, and customer engagement with Brancr. Join the waitlist today for 50% off early access.",
    url: "https://brancr.com",
    siteName: "Brancr",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}


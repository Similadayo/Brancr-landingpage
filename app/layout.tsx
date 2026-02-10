import type { Metadata } from "next";
import "./globals.css";
import StructuredData from "./components/StructuredData";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/lib/error-boundary";



export const metadata: Metadata = {
  title: {
    default: "Brancr – AI Sales Employee for African Business | Automate WhatsApp & IG",
    template: "%s | Brancr",
  },
  description: "Brancr is your AI sales employee. It automates customer chats, negotiates prices, takes orders, and schedules content—24/7. Join the waitlist for early access.",
  keywords: [
    "AI sales agent Africa",
    "automate WhatsApp business",
    "Instagram sales bot",
    "AI customer service Nigeria",
    "conversational commerce",
    "social commerce automation",
    "AI content scheduler",
    "Brancr AI",
  ],
  authors: [{ name: "Brancr" }],
  creator: "Brancr",
  publisher: "Brancr",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  metadataBase: new URL('https://brancr.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://brancr.com",
    siteName: "Brancr",
    title: "Brancr – Your AI Sales Employee",
    description: "Takes orders, negotiates prices, and closes deals in your DMs 24/7. Stop leaving money on the table.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Brancr - AI Sales Employee",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brancr – Your AI Sales Employee",
    description: "Takes orders, negotiates prices, and closes deals in your DMs 24/7. Stop leaving money on the table.",
    images: ["/og-image.png"],
    creator: "@brancr",
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldBeDark = theme === 'dark' || (!theme && systemPrefersDark);
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      {/* Updated background color to match config */}
      <body className="antialiased bg-white dark:bg-[#0B0A16] text-gray-900 dark:text-gray-100 overflow-x-hidden w-full selection:bg-accent-500/30 selection:text-accent-200">
        <ErrorBoundary>
          <Providers>
            <GoogleAnalytics />
            <StructuredData />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

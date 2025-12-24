import type { Metadata } from "next";
import "./globals.css";
import StructuredData from "./components/StructuredData";
import GoogleAnalytics from "./components/GoogleAnalytics";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/lib/error-boundary";



export const metadata: Metadata = {
  title: {
    default: "Brancr – AI Marketing Assistant for African SMEs | Automate Social Media",
    template: "%s | Brancr",
  },
  description: "Brancr is an AI-powered marketing assistant that helps African SMEs automate social media replies, create content, and manage customer chats from one simple chat interface. Join the waitlist for 50% off early access.",
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
    "social media automation Nigeria",
    "AI marketing Ghana",
    "automate WhatsApp business",
    "AI Instagram management",
    "Facebook marketing automation",
    "TikTok content creation AI",
    "social media management Africa",
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
    title: "Brancr – AI Marketing Assistant for African SMEs",
    description: "Automate your social media replies, content creation, and customer engagement with Brancr. Join the waitlist today for 50% off early access.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Brancr - AI Marketing Assistant for African SMEs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brancr – AI Marketing Assistant for African SMEs",
    description: "Automate your social media replies, content creation, and customer engagement with Brancr. Join the waitlist today for 50% off early access.",
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
      <body className="antialiased bg-white dark:bg-gray-900">
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


export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Brancr",
    url: "https://brancr.com",
    logo: "https://brancr.com/logo-dark.svg",
    description: "AI-powered marketing assistant for small and growing businesses in Africa",
    foundingLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressRegion: "Africa",
      },
    },
    sameAs: [
      "https://www.instagram.com/brancr",
      "https://www.linkedin.com/company/brancr",
      "https://twitter.com/brancr",
    ],
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Brancr",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
    description: "AI-powered marketing assistant that helps African SMEs automate social media management, content creation, and customer engagement",
    featureList: [
      "AI Chat-to-Sale Engine",
      "Automated Social Media Posting",
      "Content Creation & Scheduling",
      "Customer Engagement Management",
      "Performance Analytics",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Brancr",
    url: "https://brancr.com",
    description: "AI Marketing Assistant for African SMEs",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://brancr.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does Brancr&apos;s AI help with marketing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Brancr&apos;s AI Chat-to-Sale Engine instantly responds to DMs and comments, qualifies leads, and guides buyers while sounding naturally human.",
        },
      },
      {
        "@type": "Question",
        name: "What platforms does Brancr work with?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Brancr works with Facebook, Instagram, TikTok, WhatsApp, and X (Twitter).",
        },
      },
      {
        "@type": "Question",
        name: "Is Brancr available for early access?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Join our waitlist for early access and get 50% off for your first 6 months.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}


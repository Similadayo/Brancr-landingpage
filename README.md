# Brancr Landing Page

A pre-launch landing page for Brancr — an AI-powered marketing assistant for small and growing businesses (SMEs) in Africa.

## 🚀 Features

- **Modern Design**: Clean, minimal SaaS aesthetic with smooth animations
- **Fully Responsive**: Optimized for mobile, tablet, and desktop
- **Framer Motion**: Smooth fade-in and hover animations
- **Waitlist Form**: Lead capture with API integration ready
- **SEO Optimized**: Meta tags and Open Graph support
- **Vercel Ready**: Deploy-ready configuration

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Framer Motion**
- **React 18**

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Configuration

### Waitlist API Integration

The waitlist form currently uses a placeholder API route. To integrate with a database:

1. **Supabase Integration**:
   - Create a Supabase project
   - Add environment variables:
     ```env
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     ```
   - Update `app/api/waitlist/route.ts` with Supabase client code

2. **Airtable Integration**:
   - Create an Airtable base with a "Waitlist" table
   - Add environment variables:
     ```env
     AIRTABLE_API_KEY=your_airtable_key
     AIRTABLE_BASE_ID=your_base_id
     ```
   - Update `app/api/waitlist/route.ts` with Airtable API calls

## 📁 Project Structure

```
brancr/
├── app/
│   ├── api/
│   │   └── waitlist/
│   │       └── route.ts          # Waitlist API endpoint
│   ├── components/
│   │   ├── Header.tsx            # Navigation header
│   │   ├── Hero.tsx              # Hero section
│   │   ├── Features.tsx          # Core value pillars
│   │   ├── Escalation.tsx        # Intelligent escalation
│   │   ├── HowItWorks.tsx        # Process steps
│   │   ├── Feedback.tsx          # Pilot user feedback
│   │   ├── EarlyAccess.tsx       # Early access offer
│   │   ├── CTA.tsx               # Final call-to-action
│   │   └── Footer.tsx            # Footer
│   ├── waitlist/
│   │   └── page.tsx              # Waitlist form page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── public/
│   ├── logo-dark.svg             # Dark logo variant
│   └── logo-light.svg            # Light logo variant
└── package.json
```

## 🎨 Design System

### Colors
- **Primary**: `#1B1A55` (deep navy)
- **Accent**: `#635BFF` / `#5E5CE6` (violet)
- **Background**: `#F9FAFB` (neutral)

### Typography
- **Font**: Inter (Google Fonts)

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Vercel will automatically detect Next.js and configure the build
4. Add environment variables if using Supabase/Airtable
5. Deploy!

### Environment Variables

Create a `.env.local` file for local development:
```env
# Database Integration (Optional)
SUPABASE_URL=
SUPABASE_KEY=
# or
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## 🔍 SEO Setup

This site includes comprehensive SEO optimization. **See `SEO_CHECKLIST.md` for complete setup instructions.**

### Quick SEO Setup:

1. **Create OG Image** (Required for social sharing):
   - Create a 1200×630px image
   - Save as `/public/og-image.png`
   - See `public/og-image-placeholder.txt` for instructions

2. **Google Search Console**:
   - Verify site ownership
   - Submit sitemap: `https://brancr.com/sitemap.xml`

3. **Add Analytics** (Optional):
   - Get Google Analytics 4 Measurement ID
   - Add to `.env.local` as `NEXT_PUBLIC_GA_ID`
   - Analytics will automatically start tracking

4. **Update Social Links**:
   - Edit `app/components/StructuredData.tsx`
   - Update social media URLs in `sameAs` array

5. **Verify with Search Engines**:
   - Add verification codes to `app/layout.tsx`
   - Uncomment verification object and add codes

**All SEO features are already implemented:**
- ✅ Structured data (JSON-LD)
- ✅ Sitemap.xml (auto-generated)
- ✅ Robots.txt
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ Enhanced metadata
- ✅ Canonical URLs

## 📝 License

© 2025 Brancr. All rights reserved.


# SEO Setup Checklist for Brancr

This checklist will help you maximize your search engine visibility after deployment.

## ✅ Already Implemented

- [x] Enhanced metadata with keywords
- [x] Structured data (JSON-LD) for Organization, SoftwareApplication, WebSite, FAQ
- [x] Sitemap.xml auto-generation
- [x] Robots.txt configuration
- [x] Open Graph tags for social sharing
- [x] Twitter Card metadata
- [x] Canonical URLs
- [x] Semantic HTML structure

## 🔧 Actions Required

### 1. Create Open Graph Image (Priority: High)

**File needed:** `/public/og-image.png`

**Specifications:**
- Dimensions: 1200px × 630px
- Format: PNG or JPG
- Content: Include "Brancr" logo, tagline "AI Marketing Assistant for African SMEs", and key visual elements

**Tools to create:**
- Canva (https://canva.com) - Search "Open Graph" template
- Figma
- Photoshop

**Quick creation:**
1. Use a tool like Canva
2. Create 1200×630px design
3. Add Brancr logo, headline, and gradient background
4. Export as PNG
5. Save to `/public/og-image.png`

### 2. Google Search Console Setup (Priority: High)

**Steps:**
1. Go to https://search.google.com/search-console
2. Add property: `https://brancr.com`
3. Verify ownership using one of these methods:
   - HTML file upload (download from GSC)
   - HTML tag (add to `<head>` in layout.tsx)
   - Domain name provider

**After verification:**
1. Submit sitemap: `https://brancr.com/sitemap.xml`
2. Request indexing for key pages
3. Monitor search performance

### 3. Add Verification Codes (Priority: Medium)

**File:** `app/layout.tsx`

Uncomment and add verification codes in the `verification` object:

```typescript
verification: {
  google: 'your-google-verification-code-here',
  // bing: 'your-bing-verification-code-here',
  // yandex: 'your-yandex-verification-code-here',
},
```

**Where to find codes:**
- Google: Search Console → Settings → Ownership verification
- Bing: Bing Webmaster Tools → Settings → Verify ownership
- Yandex: Yandex.Webmaster → Settings → Verification

### 4. Update Social Media Links (Priority: Medium)

**File:** `app/components/StructuredData.tsx`

Update the `sameAs` array with your actual social media URLs:

```typescript
sameAs: [
  "https://www.instagram.com/brancr",      // Update with real handle
  "https://www.linkedin.com/company/brancr", // Update with real URL
  "https://twitter.com/brancr",              // Update with real handle
],
```

### 5. Update Twitter Creator Handle (Priority: Low)

**File:** `app/layout.tsx`

Update the Twitter creator handle:

```typescript
twitter: {
  creator: "@brancr", // Update with real Twitter handle
},
```

### 6. Submit to Other Search Engines (Priority: Medium)

**Bing Webmaster Tools:**
1. Go to https://www.bing.com/webmasters
2. Add site: `https://brancr.com`
3. Submit sitemap: `https://brancr.com/sitemap.xml`

**Yandex Webmaster (if targeting Russian/European markets):**
1. Go to https://webmaster.yandex.com
2. Add site and verify
3. Submit sitemap

### 7. Set Up Analytics (Priority: High)

**Google Analytics 4:**
1. Create GA4 property at https://analytics.google.com
2. Get measurement ID (G-XXXXXXXXXX)
3. Add to Next.js (create `app/components/GoogleAnalytics.tsx`)

**Alternative:**
- Vercel Analytics (built-in if deployed on Vercel)
- Plausible Analytics (privacy-focused)

### 8. Content Optimization (Priority: High)

**Ensure all pages have:**
- Unique, descriptive titles
- Meta descriptions (150-160 characters)
- H1 tags with primary keywords
- Alt text on all images
- Internal linking between pages

**Current status:**
- ✅ Home page optimized
- ✅ Privacy page optimized
- ✅ Terms page optimized
- ✅ Waitlist page optimized

### 9. Technical SEO Verification (Priority: High)

**Check these after deployment:**
- [ ] Site loads fast (use PageSpeed Insights)
- [ ] Mobile-friendly (Google Mobile-Friendly Test)
- [ ] HTTPS enabled
- [ ] No broken links (use Screaming Frog or similar)
- [ ] XML sitemap accessible at `/sitemap.xml`
- [ ] Robots.txt accessible at `/robots.txt`

**Tools:**
- Google PageSpeed Insights: https://pagespeed.web.dev
- Google Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- Screaming Frog: https://www.screamingfrog.co.uk/seo-spider

### 10. Local SEO (Priority: Medium - if targeting specific regions)

**If targeting specific African countries:**
1. Add location-specific content
2. Create location pages (e.g., `/nigeria`, `/ghana`)
3. Add local business schema if applicable
4. Get listed in local business directories

### 11. Content Marketing & Backlinks (Priority: Medium)

**Content Strategy:**
- Blog posts about AI marketing for SMEs
- Case studies from pilot users
- How-to guides
- Guest posts on African tech blogs

**Backlink opportunities:**
- Tech blogs in Nigeria/Ghana
- SME business directories
- Startup directories (TechCrunch Africa, etc.)
- Product Hunt launch
- Hacker News (if relevant)

### 12. Monitor & Optimize (Priority: Ongoing)

**Set up monitoring:**
- Google Search Console (weekly checks)
- Google Analytics (daily/weekly)
- Bing Webmaster Tools (monthly)
- Rank tracking (optional tools like Ahrefs, SEMrush)

**Key metrics to track:**
- Organic traffic
- Keyword rankings
- Click-through rates (CTR)
- Bounce rate
- Conversion rate (waitlist signups)

## 📊 Expected Timeline

- **Week 1-2:** Setup verification, analytics, OG image
- **Week 2-4:** First indexing, initial rankings
- **Month 2-3:** Improved rankings, traffic growth
- **Month 3-6:** Established rankings, steady traffic

## 🚀 Quick Wins

1. **Create OG image** (1 hour) - Immediate social sharing improvement
2. **Google Search Console** (30 min) - Essential for visibility
3. **Submit sitemap** (5 min) - Faster indexing
4. **Fix broken links** (if any) - Better user experience

## 📝 Notes

- SEO is a long-term strategy - results take 3-6 months
- Focus on quality content over keyword stuffing
- User experience signals (bounce rate, time on site) affect rankings
- Mobile-first indexing is critical - ensure mobile experience is excellent

## 🔗 Helpful Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)
- [Open Graph Protocol](https://ogp.me/)

---

**Last Updated:** November 2025
**Status:** Ready for deployment after OG image creation


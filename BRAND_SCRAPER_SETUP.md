# BrandPilot - Website Brand Scraper Setup Guide

## Overview

This feature uses Claude Haiku API to scrape website content and automatically extract brand information (company name, description, tone, products, etc.).

## Architecture

```
User enters website URL
          ↓
Frontend: BrandImport component
          ↓
API Route: /api/scrape-brand-info
          ↓
lib/claude-scraper.ts
          ↓
1. Fetch website HTML
2. Clean HTML → Plain text
3. Send to Claude Haiku
4. Parse JSON response
          ↓
Return extracted brand info to frontend
          ↓
User reviews and accepts
          ↓
Save to project settings in database
```

## Installation

### 1. Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

### 2. Set up environment variables

Add to `.env.local`:

```env
# Claude API Key for brand scraping
CLAUDE_API_KEY=your_api_key_here
```

**Get your API key:**
1. Go to https://console.anthropic.com/account/keys
2. Create a new API key
3. Copy and paste into `.env.local`

### 3. Files Created

- `lib/claude-scraper.ts` - Core scraping logic using Claude Haiku
- `app/api/scrape-brand-info/route.ts` - API endpoint
- `lib/use-brand-scraper.ts` - React hook for frontend
- `components/onboarding/brand-import.tsx` - UI component

## Usage

### In a React component:

```tsx
import { BrandImport } from "@/components/onboarding/brand-import";

export default function OnboardingPage() {
  const handleBrandDataExtracted = (data) => {
    // data contains:
    // - company_name
    // - description
    // - mission
    // - tone_of_voice
    // - key_products_services[]
    // - target_audience

    // Save to your database/project settings
    console.log("Brand info extracted:", data);
  };

  return (
    <BrandImport
      onBrandDataExtracted={handleBrandDataExtracted}
      onSkip={() => console.log("Skipped")}
    />
  );
}
```

### Programmatic use:

```tsx
import { useBrandScraper } from "@/lib/use-brand-scraper";

function MyComponent() {
  const { loading, error, data, scrapeWebsite } = useBrandScraper();

  const handleScrape = async () => {
    await scrapeWebsite("https://example.com");
  };

  return (
    <button onClick={handleScrape} disabled={loading}>
      {loading ? "Scraping..." : "Scrape Website"}
    </button>
  );
}
```

## How It Works

### Step 1: Fetch Website

The scraper fetches the website HTML with a standard user agent header:

```typescript
const response = await fetch(websiteUrl, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
  timeout: 10000,
});
```

### Step 2: Clean HTML to Text

Removes:
- Script and style tags
- HTML markup
- Excessive whitespace
- Decodes HTML entities

Result: Plain text content (~8000 chars max)

### Step 3: Send to Claude Haiku

```typescript
const message = await client.messages.create({
  model: "claude-3-5-haiku-20241022",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: `Extract brand info from this website text...`
    }
  ]
});
```

Claude extracts:
- Company name
- Tagline
- Description (2-3 sentences)
- Mission statement
- Brand values
- Target audience
- Tone of voice
- Key products/services
- Social media handles

### Step 4: Parse & Return

Claude returns valid JSON that gets parsed and returned to frontend.

## API Response Format

### Success (200)
```json
{
  "success": true,
  "data": {
    "company_name": "Acme Corp",
    "tagline": "The leading ACME solutions provider",
    "description": "We make innovative ACME products...",
    "mission": "To revolutionize ACME",
    "values": ["Innovation", "Quality", "Customer Focus"],
    "target_audience": "Enterprise companies",
    "tone_of_voice": "Professional and innovative",
    "key_products_services": ["ACME Software", "ACME Consulting"],
    "social_handles": {
      "twitter": "@acmecorp",
      "linkedin": "acme-corp",
      "instagram": null,
      "facebook": null,
      "reddit": null
    }
  },
  "timestamp": "2024-11-08T10:30:00Z"
}
```

### Error (400/500)
```json
{
  "success": false,
  "error": "Failed to fetch website: Connection timeout"
}
```

## Error Handling

The scraper handles:
- Invalid URLs
- Unreachable websites
- Timeout errors (10 sec limit)
- Claude API errors
- Invalid HTML/text content
- Malformed JSON responses

All errors are logged and returned with user-friendly messages.

## Testing

### Manual Test

```bash
curl -X POST http://localhost:3000/api/scrape-brand-info \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://www.anthropic.com"}'
```

### In TypeScript

```typescript
import { extractBrandInfoFromWebsite } from "@/lib/claude-scraper";

const result = await extractBrandInfoFromWebsite("https://www.anthropic.com");
console.log(result);
```

## Cost

Claude Haiku is very cheap:
- Input: $0.80 per million tokens
- Output: $4.00 per million tokens

Average website scrape:
- Input: ~1,500 tokens
- Output: ~200 tokens
- Cost: ~$0.001 per request (less than 1 cent)

## Limitations

1. **Website Size**: Only processes first 8000 characters of text
2. **Timeout**: 10 second timeout per request
3. **Rate Limiting**: Subject to Anthropic API rate limits
4. **Data Quality**: Depends on website content structure
5. **Blocked Sites**: Some sites may block automated requests

## Next Steps

1. ✅ Install dependencies: `npm install @anthropic-ai/sdk`
2. ✅ Add `CLAUDE_API_KEY` to `.env.local`
3. ✅ Use `<BrandImport>` component in onboarding flow
4. ✅ Save extracted data to Supabase project settings
5. ✅ Add retry logic for failed extractions
6. ✅ Implement caching to avoid re-scraping same URLs

## Integration with Supabase

After extracting brand info, save to project settings:

```typescript
// In your onboarding/component
const { supabase } = useSupabase();

const handleBrandDataExtracted = async (data) => {
  // Update project settings
  await supabase
    .from('project_settings')
    .update({
      brand_name: data.company_name,
      brand_description: data.description,
      brand_knowledge: data.mission,
      keywords: JSON.stringify(data.key_products_services),
    })
    .eq('project_id', projectId);
};
```

## Troubleshooting

### "CLAUDE_API_KEY not found"
- Check `.env.local` has the key
- Restart dev server: `npm run dev`
- Verify key format (should start with `sk-`)

### "Failed to fetch website"
- Website may be blocking bots
- Try with a different URL
- Check if site has robots.txt restrictions

### "Invalid JSON response"
- Website content may be too complex
- Try with a simpler website
- Check Claude API status page

### Slow extraction
- Large websites take longer to process
- Claude Haiku is fast but network/parsing adds time
- Typical: 2-5 seconds per website

## Security Notes

- API key is never exposed to client (only used server-side)
- Website content is only temporarily processed (not stored)
- No website data is cached or logged permanently
- Claude API has its own security/compliance policies

---

**Questions?** Check Anthropic docs: https://docs.anthropic.com

"use client";

import { useState } from "react";
import { BrandImport } from "@/components/onboarding/brand-import";

/**
 * Test page for the brand scraper
 * Visit: http://localhost:3000/test-scraper
 */
export default function TestScraperPage() {
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleBrandDataExtracted = (data: any) => {
    console.log("Brand data extracted:", data);
    setExtractedData(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-mono font-bold text-neutral-900 mb-2">
            Brand Scraper Test
          </h1>
          <p className="text-neutral-600 font-mono text-sm">
            Test the Claude-powered website scraper
          </p>
        </div>

        {/* Import Component */}
        <div className="mb-12">
          <BrandImport
            onBrandDataExtracted={handleBrandDataExtracted}
            onSkip={() => alert("Skipped")}
          />
        </div>

        {/* Results */}
        {extractedData && (
          <div className="space-y-4">
            <h2 className="text-2xl font-mono font-bold text-neutral-900">
              Extracted Data
            </h2>
            <pre className="bg-neutral-900 text-green-400 p-6 rounded-lg overflow-auto text-sm font-mono">
              {JSON.stringify(extractedData, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-mono font-bold text-blue-900 mb-3">Setup Instructions</h3>
          <ol className="space-y-2 font-mono text-sm text-blue-800">
            <li>1. Get your API key from https://console.anthropic.com/account/keys</li>
            <li>2. Add to .env.local: CLAUDE_API_KEY=your_key_here</li>
            <li>3. Restart dev server: npm run dev</li>
            <li>4. Enter a website URL and click "Extract Brand Info"</li>
            <li>5. Claude Haiku will analyze and extract brand information</li>
          </ol>
        </div>

        {/* Example URLs */}
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-mono font-bold text-green-900 mb-3">Try These URLs</h3>
          <ul className="space-y-2 font-mono text-sm text-green-800">
            <li>• https://www.anthropic.com</li>
            <li>• https://www.stripe.com</li>
            <li>• https://www.vercel.com</li>
            <li>• https://www.github.com</li>
            <li>• Or enter your own website URL</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

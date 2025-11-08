"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrandScraper } from "@/lib/use-brand-scraper";
import { Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";

interface BrandImportProps {
  onBrandDataExtracted: (data: {
    company_name: string;
    description: string;
    mission: string;
    tone_of_voice: string;
    key_products_services: string[];
    target_audience: string;
  }) => void;
  onSkip?: () => void;
}

export function BrandImport({ onBrandDataExtracted, onSkip }: BrandImportProps) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { loading, error, data, scrapeWebsite, reset } = useBrandScraper();

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (websiteUrl.trim()) {
      await scrapeWebsite(websiteUrl);
      setShowResults(true);
    }
  };

  const handleUseData = () => {
    if (data) {
      onBrandDataExtracted({
        company_name: data.company_name,
        description: data.description,
        mission: data.mission,
        tone_of_voice: data.tone_of_voice,
        key_products_services: data.key_products_services,
        target_audience: data.target_audience,
      });
      setShowResults(false);
    }
  };

  const handleStartOver = () => {
    reset();
    setWebsiteUrl("");
    setShowResults(false);
  };

  return (
    <Card className="w-full border border-neutral-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle className="font-mono text-xl">Import Brand Information</CardTitle>
            <CardDescription className="font-mono text-sm">
              Powered by Claude Haiku - Analyzes your website in seconds
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!showResults ? (
          <>
            <form onSubmit={handleScrape} className="space-y-4">
              <div>
                <label className="block font-mono text-sm font-semibold mb-2">Website URL</label>
                <Input
                  type="url"
                  placeholder="https://yourbrand.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  disabled={loading}
                  className="font-mono text-sm"
                />
              </div>

              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700 font-mono">{error}</div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading || !websiteUrl.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-mono"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Extract Brand Info"
                  )}
                </Button>

                {onSkip && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSkip}
                    disabled={loading}
                    className="font-mono"
                  >
                    Skip
                  </Button>
                )}
              </div>
            </form>
          </>
        ) : data ? (
          <>
            <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700 font-mono">Successfully extracted brand information!</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-mono text-xs font-semibold text-neutral-600 mb-1">
                  Company Name
                </label>
                <p className="font-mono text-sm bg-neutral-50 p-3 rounded border border-neutral-200">
                  {data.company_name || "—"}
                </p>
              </div>

              <div>
                <label className="block font-mono text-xs font-semibold text-neutral-600 mb-1">
                  Description
                </label>
                <p className="font-mono text-sm bg-neutral-50 p-3 rounded border border-neutral-200 line-clamp-3">
                  {data.description || "—"}
                </p>
              </div>

              <div>
                <label className="block font-mono text-xs font-semibold text-neutral-600 mb-1">
                  Tone of Voice
                </label>
                <p className="font-mono text-sm bg-neutral-50 p-3 rounded border border-neutral-200">
                  {data.tone_of_voice || "—"}
                </p>
              </div>

              {data.key_products_services && data.key_products_services.length > 0 && (
                <div>
                  <label className="block font-mono text-xs font-semibold text-neutral-600 mb-2">
                    Products / Services
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {data.key_products_services.map((item) => (
                      <span
                        key={item}
                        className="font-mono text-xs bg-blue-100 text-blue-900 px-3 py-1 rounded-full"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-mono text-xs font-semibold text-neutral-600 mb-1">
                  Target Audience
                </label>
                <p className="font-mono text-sm bg-neutral-50 p-3 rounded border border-neutral-200">
                  {data.target_audience || "—"}
                </p>
              </div>

              {data.mission && (
                <div>
                  <label className="block font-mono text-xs font-semibold text-neutral-600 mb-1">Mission</label>
                  <p className="font-mono text-sm bg-neutral-50 p-3 rounded border border-neutral-200">
                    {data.mission}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUseData}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-mono"
              >
                Use This Information
              </Button>
              <Button onClick={handleStartOver} variant="outline" className="flex-1 font-mono">
                Try Another URL
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

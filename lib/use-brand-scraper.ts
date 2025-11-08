import { useState } from "react";

interface ExtractedBrandInfo {
  company_name: string;
  tagline: string;
  description: string;
  mission: string;
  values: string[];
  target_audience: string;
  tone_of_voice: string;
  key_products_services: string[];
  social_handles: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    reddit?: string;
  };
}

interface UseBrandScraperResult {
  loading: boolean;
  error: string | null;
  data: ExtractedBrandInfo | null;
  scrapeWebsite: (websiteUrl: string) => Promise<void>;
  reset: () => void;
}

/**
 * React hook for scraping brand information from a website
 */
export function useBrandScraper(): UseBrandScraperResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExtractedBrandInfo | null>(null);

  const scrapeWebsite = async (websiteUrl: string) => {
    // Reset state
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Validate URL
      if (!websiteUrl || websiteUrl.trim() === "") {
        throw new Error("Please enter a valid URL");
      }

      // Add protocol if missing
      let url = websiteUrl.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      console.log("[Hook] Starting brand extraction for:", url);

      // Call API endpoint
      const response = await fetch("/api/scrape-brand-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteUrl: url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to scrape website");
      }

      const result = await response.json();

      console.log("[Hook] Successfully extracted brand info");
      setData(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("[Hook] Error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return {
    loading,
    error,
    data,
    scrapeWebsite,
    reset,
  };
}

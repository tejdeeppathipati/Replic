"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Twitter, ChevronRight, ChevronLeft, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ExtractedBrandInfo } from "@/lib/claude-scraper";

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Clear old localStorage data on component mount to ensure fresh start
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("brandpilot_config");
    }
  }, []);

  // Step 1 - Website
  const [website, setWebsite] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  // Step 2 - Auto-filled from scraper
  const [scrapedSummary, setScrapedSummary] = useState("");
  const [scrapedInsights, setScrapedInsights] = useState<string[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [scrapedRawData, setScrapedRawData] = useState<Record<string, unknown>>({});

  // Step 2 - User responses to suggested questions
  const [questionResponses, setQuestionResponses] = useState<Record<string, string>>({});

  // Step 3 - Manual comprehensive business info
  const [businessType, setBusinessType] = useState("");
  const [products, setProducts] = useState("");
  const [uniqueValue, setUniqueValue] = useState("");
  const [brandValues, setBrandValues] = useState("");
  const [brandPersonality, setBrandPersonality] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [contentPillars, setContentPillars] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [differentiation, setDifferentiation] = useState("");
  const [successMetrics, setSuccessMetrics] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const handleImport = async () => {
    setImporting(true);
    setImportError("");

    try {
      const response = await fetch("/api/scrape-brand-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: website }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to extract brand info");
      }

      const data = await response.json();
      const brandData = data.data as ExtractedBrandInfo;

      // Store comprehensive analysis from scraper
      setScrapedSummary(brandData.summary || "");
      setScrapedInsights(brandData.key_insights || []);
      setSuggestedQuestions(brandData.suggested_questions || []);
      setScrapedRawData(brandData.raw_analysis || {});

      // Initialize question responses with empty strings
      const emptyResponses: Record<string, string> = {};
      (brandData.suggested_questions || []).forEach((_, index) => {
        emptyResponses[`question_${index}`] = "";
      });
      setQuestionResponses(emptyResponses);

      setCurrentStep(2);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import brand info";
      setImportError(message);
    } finally {
      setImporting(false);
    }
  };

  const handleFinish = () => {
    const fullConfig = {
      website,
      // Scraped comprehensive data
      scrapedSummary,
      scrapedInsights,
      scrapedRawData,
      // User responses to suggested questions
      questionResponses,
      // Step 3 detailed business info
      businessType,
      products,
      uniqueValue,
      brandValues,
      brandPersonality,
      targetMarket,
      communicationStyle,
      contentPillars,
      competitors,
      differentiation,
      successMetrics,
      additionalInfo,
    };

    localStorage.setItem("brandpilot_onboarded", "true");
    localStorage.setItem("brandpilot_config", JSON.stringify(fullConfig));
    router.push("/dashboard");
  };

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white p-4">
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Twitter className="h-8 w-8 text-[#1D9BF0]" />
            <span className="font-mono text-xl font-bold">BrandPilot</span>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-mono font-semibold">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-sm font-mono text-muted-foreground">
              {Math.round(progressPercentage)}% complete
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-[#1D9BF0] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-2xl">
              {currentStep === 1 && "Import Brand Information"}
              {currentStep === 2 && "Review & Refine"}
              {currentStep === 3 && "Comprehensive Business Details"}
            </CardTitle>
            <CardDescription className="font-mono">
              {currentStep === 1 && "Let AI learn about your brand from your website"}
              {currentStep === 2 && "Verify and enhance the auto-filled information"}
              {currentStep === 3 && "Provide comprehensive details about your business"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* STEP 1 - Website Import */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website" className="font-mono">Website URL</Label>
                  <Input
                    id="website"
                    placeholder="https://yourbrand.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-neutral-500 font-mono">We'll analyze your website to auto-fill basic information</p>
                </div>

                {importError && (
                  <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-mono">{importError}</p>
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={!website || importing}
                  className="w-full bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing with Claude...
                    </>
                  ) : (
                    "Extract Brand Info"
                  )}
                </Button>
              </div>
            )}

            {/* STEP 2 - Website Analysis Results */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Success message */}
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full flex-shrink-0">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-green-900">Website Analyzed Successfully!</p>
                    <p className="text-xs font-mono text-green-800">We've extracted comprehensive information about your brand</p>
                  </div>
                </div>

                {/* Summary section */}
                {scrapedSummary && (
                  <div>
                    <h3 className="font-mono font-semibold text-base mb-3 text-neutral-900">Brand Overview</h3>
                    <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg">
                      <p className="text-sm font-mono text-neutral-800 leading-relaxed whitespace-pre-wrap">
                        {scrapedSummary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Raw analysis data */}
                {scrapedRawData && Object.keys(scrapedRawData).length > 0 && (
                  <div>
                    <h3 className="font-mono font-semibold text-base mb-3 text-neutral-900">Extracted Information</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(scrapedRawData).map(([key, value]) => {
                        if (!value || (Array.isArray(value) && value.length === 0)) return null;
                        return (
                          <div key={key} className="border border-neutral-200 rounded-lg p-3">
                            <p className="text-xs font-mono font-semibold text-neutral-600 mb-1 uppercase">
                              {key.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm font-mono text-neutral-800">
                              {Array.isArray(value) ? value.join(", ") : String(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Call to action */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm font-mono text-blue-900">
                    Review the information above and continue to the next step to complete your brand profile with additional details.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3 - Comprehensive Business Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm font-mono text-blue-900">
                    <strong>Complete your brand profile</strong> to enable Claude to generate authentic, on-brand content tailored to your business
                  </p>
                </div>

                {/* SECTION 1: Brand Identity */}
                <div className="border-t pt-6">
                  <h3 className="font-mono font-semibold text-base mb-4 text-neutral-900">Brand Identity</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="brandPersonality" className="font-mono">Brand Personality</Label>
                      <Input
                        id="brandPersonality"
                        value={brandPersonality}
                        onChange={(e) => setBrandPersonality(e.target.value)}
                        placeholder="e.g., innovative, approachable, data-driven, creative, trustworthy"
                        className="font-mono"
                      />
                      <p className="text-xs text-neutral-500 font-mono">Descriptive traits that define your brand</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brandValues" className="font-mono">Core Values & Mission</Label>
                      <textarea
                        id="brandValues"
                        value={brandValues}
                        onChange={(e) => setBrandValues(e.target.value)}
                        className="w-full min-h-16 p-3 border rounded-md font-mono text-sm"
                        placeholder="What values drive your company? What's your mission statement?"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Business Context */}
                <div className="border-t pt-6">
                  <h3 className="font-mono font-semibold text-base mb-4 text-neutral-900">Business Context</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessType" className="font-mono">Business Type</Label>
                      <Input
                        id="businessType"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        placeholder="e.g., B2B SaaS, E-commerce, Consulting, Agency"
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="uniqueValue" className="font-mono">Unique Value Proposition</Label>
                      <textarea
                        id="uniqueValue"
                        value={uniqueValue}
                        onChange={(e) => setUniqueValue(e.target.value)}
                        className="w-full min-h-16 p-3 border rounded-md font-mono text-sm"
                        placeholder="What makes your business unique? Why should customers choose you over alternatives?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetMarket" className="font-mono">Target Market & Audience</Label>
                      <textarea
                        id="targetMarket"
                        value={targetMarket}
                        onChange={(e) => setTargetMarket(e.target.value)}
                        className="w-full min-h-16 p-3 border rounded-md font-mono text-sm"
                        placeholder="Describe your ideal customer. Who are they? What are their pain points and goals?"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Competitive Positioning */}
                <div className="border-t pt-6">
                  <h3 className="font-mono font-semibold text-base mb-4 text-neutral-900">Competitive Positioning</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="competitors" className="font-mono">Main Competitors</Label>
                      <Input
                        id="competitors"
                        value={competitors}
                        onChange={(e) => setCompetitors(e.target.value)}
                        placeholder="e.g., Competitor A, Competitor B, Competitor C"
                        className="font-mono"
                      />
                      <p className="text-xs text-neutral-500 font-mono">Names of companies you compete with</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="differentiation" className="font-mono">How You Differentiate</Label>
                      <textarea
                        id="differentiation"
                        value={differentiation}
                        onChange={(e) => setDifferentiation(e.target.value)}
                        className="w-full min-h-16 p-3 border rounded-md font-mono text-sm"
                        placeholder="What's your competitive advantage? What do you do better or differently?"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Communication & Content Strategy */}
                <div className="border-t pt-6">
                  <h3 className="font-mono font-semibold text-base mb-4 text-neutral-900">Communication & Content</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="communicationStyle" className="font-mono">Communication Style</Label>
                      <textarea
                        id="communicationStyle"
                        value={communicationStyle}
                        onChange={(e) => setCommunicationStyle(e.target.value)}
                        className="w-full min-h-16 p-3 border rounded-md font-mono text-sm"
                        placeholder="How should your brand communicate? E.g., formal/casual, technical/simple, humorous/serious, inspiring/practical"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contentPillars" className="font-mono">Content Pillars</Label>
                      <Input
                        id="contentPillars"
                        value={contentPillars}
                        onChange={(e) => setContentPillars(e.target.value)}
                        placeholder="e.g., Industry insights, Product updates, Customer stories, Tips & tricks"
                        className="font-mono"
                      />
                      <p className="text-xs text-neutral-500 font-mono">Main themes and topics for your content</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="successMetrics" className="font-mono">Success Metrics</Label>
                      <Input
                        id="successMetrics"
                        value={successMetrics}
                        onChange={(e) => setSuccessMetrics(e.target.value)}
                        placeholder="e.g., Brand awareness, Lead generation, Community engagement, Sales"
                        className="font-mono"
                      />
                      <p className="text-xs text-neutral-500 font-mono">What does success look like for your content?</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 5: Additional Context */}
                <div className="border-t pt-6">
                  <h3 className="font-mono font-semibold text-base mb-4 text-neutral-900">Additional Context</h3>

                  <div className="space-y-2">
                    <Label htmlFor="additionalInfo" className="font-mono">Important Details</Label>
                    <textarea
                      id="additionalInfo"
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      className="w-full min-h-16 p-3 border rounded-md font-mono text-sm"
                      placeholder="Any other important details: industry trends, recent company news, content do's and don'ts, seasonal considerations, etc."
                    />
                  </div>
                </div>

                {/* SECTION 6: Answer Website Analysis Questions */}
                {suggestedQuestions.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="font-mono font-semibold text-base mb-4 text-neutral-900">Website Analysis Questions</h3>
                    <p className="text-xs font-mono text-neutral-500 mb-4">Based on our analysis of your website, answer these questions to help us understand your brand better</p>
                    <div className="space-y-6">
                      {suggestedQuestions.map((question, index) => {
                        // Define dropdown options for each question
                        let options: string[] = [];
                        if (index === 0) {
                          // Question 1: Business objective
                          options = [
                            "Brand awareness",
                            "Lead generation",
                            "Sales/Revenue",
                            "Community engagement",
                            "Thought leadership",
                            "Customer retention",
                          ];
                        } else if (index === 1) {
                          // Question 2: Tone and style
                          options = [
                            "Professional & formal",
                            "Casual & friendly",
                            "Technical & detailed",
                            "Creative & innovative",
                            "Educational & informative",
                            "Inspiring & motivational",
                            "Humorous & entertaining",
                          ];
                        } else if (index === 2) {
                          // Question 3: Content themes (allow multiple selections)
                          options = [
                            "Industry insights & trends",
                            "Product updates & launches",
                            "Customer success stories",
                            "Tips & tutorials",
                            "Behind-the-scenes content",
                            "Company news & announcements",
                            "Thought leadership & opinion",
                            "Educational resources",
                          ];
                        }

                        return (
                          <div key={index} className="space-y-2">
                            <Label htmlFor={`question_${index}`} className="font-mono text-sm font-semibold">
                              Q{index + 1}: {question}
                            </Label>
                            {index === 2 ? (
                              // Multi-select for question 3
                              <div className="grid grid-cols-2 gap-3">
                                {options.map((option) => (
                                  <div key={option} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`q${index}_${option}`}
                                      value={option}
                                      checked={
                                        questionResponses[`question_${index}`]
                                          ?.split(",")
                                          .includes(option) || false
                                      }
                                      onChange={(e) => {
                                        const currentValue = questionResponses[`question_${index}`] || "";
                                        const currentOptions = currentValue
                                          ? currentValue.split(",").map((s) => s.trim())
                                          : [];

                                        let newOptions: string[];
                                        if (e.target.checked) {
                                          newOptions = [...currentOptions, option];
                                        } else {
                                          newOptions = currentOptions.filter((o) => o !== option);
                                        }

                                        setQuestionResponses({
                                          ...questionResponses,
                                          [`question_${index}`]: newOptions.join(", "),
                                        });
                                      }}
                                      className="w-4 h-4 cursor-pointer"
                                    />
                                    <label htmlFor={`q${index}_${option}`} className="ml-2 text-sm font-mono cursor-pointer">
                                      {option}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // Single select dropdown for questions 1 and 2
                              <select
                                id={`question_${index}`}
                                value={questionResponses[`question_${index}`] || ""}
                                onChange={(e) =>
                                  setQuestionResponses({
                                    ...questionResponses,
                                    [`question_${index}`]: e.target.value,
                                  })
                                }
                                className="w-full p-3 border rounded-md font-mono text-sm bg-white cursor-pointer"
                              >
                                <option value="">Select an option...</option>
                                {options.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            )}
                            {index < suggestedQuestions.length - 1 && (
                              <p className="text-xs text-neutral-400 font-mono mt-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            variant="outline"
            className="font-mono"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono"
              disabled={
                (currentStep === 1 && !website) ||
                (currentStep === 2 && !scrapedSummary)
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              className="bg-[#22C55E] hover:bg-[#16a34a] font-mono"
            >
              Activate BrandPilot
              <Check className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

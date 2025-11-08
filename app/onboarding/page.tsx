"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Twitter, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const TOTAL_STEPS = 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - Website
  const [website, setWebsite] = useState("");
  const [importing, setImporting] = useState(false);

  // Step 2 - Brand Info (auto-filled after import)
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      setBrandName("Your Brand");
      setDescription("AI-powered productivity tools for startups");
      setImporting(false);
      setCurrentStep(2);
    }, 1500);
  };

  const handleFinish = () => {
    localStorage.setItem("brandpilot_onboarded", "true");
    localStorage.setItem("brandpilot_config", JSON.stringify({
      brandName,
      description,
      website,
    }));
    router.push("/dashboard");
  };

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
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
              {currentStep === 2 && "Review & Confirm"}
            </CardTitle>
            <CardDescription className="font-mono">
              {currentStep === 1 && "Let AI learn about your brand from your website"}
              {currentStep === 2 && "Verify your brand details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                </div>
                <Button
                  onClick={handleImport}
                  disabled={!website || importing}
                  className="w-full bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono"
                >
                  {importing ? "Importing..." : "Import Info"}
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brandName" className="font-mono">Brand Name</Label>
                  <Input
                    id="brandName"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-mono">Description</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-24 p-3 border rounded-md font-mono text-sm"
                  />
                </div>
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
              disabled={currentStep === 1}
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

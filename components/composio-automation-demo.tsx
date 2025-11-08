"use client";

/**
 * Composio Automation Demo Component
 * 
 * This is a demo component showing how to use Composio + Claude automation.
 * You can add this to any page to test the automation features.
 * 
 * Usage:
 * import { ComposioAutomationDemo } from "@/components/composio-automation-demo";
 * <ComposioAutomationDemo />
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProjects } from "@/lib/projects-context";

export function ComposioAutomationDemo() {
  const { currentProject } = useProjects();
  const [isPosting, setIsPosting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = currentProject?.id || "default";
  const companyInfo = currentProject?.settings.brandName || "Your Company";

  const handleAutoPost = async (action: "tweet" | "reddit" | "multi") => {
    setIsPosting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/composio/automate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
          companyInfo,
          topic:
            action === "tweet"
              ? "our amazing new feature that helps startups grow faster"
              : action === "reddit"
              ? "How we built our startup with AI automation"
              : "We just launched our public beta! 🚀",
          subreddit: action !== "tweet" ? "test" : undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to post");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl">
      <h2 className="font-mono text-xl font-bold mb-4">
        🤖 AI-Powered Social Media Automation
      </h2>
      <p className="font-mono text-sm text-neutral-600 mb-6">
        Test Claude + Composio automation for {companyInfo}
      </p>

      <div className="space-y-4">
        {/* Auto-Tweet Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => handleAutoPost("tweet")}
            disabled={isPosting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-mono"
          >
            {isPosting ? "Posting..." : "🐦 Auto-Post Tweet"}
          </Button>
          <span className="font-mono text-xs text-neutral-600">
            Claude will generate and post an engaging tweet
          </span>
        </div>

        {/* Auto-Reddit Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => handleAutoPost("reddit")}
            disabled={isPosting}
            className="bg-orange-600 hover:bg-orange-700 text-white font-mono"
          >
            {isPosting ? "Posting..." : "🔥 Auto-Post to Reddit"}
          </Button>
          <span className="font-mono text-xs text-neutral-600">
            Claude will create a Reddit post in r/test
          </span>
        </div>

        {/* Multi-Platform Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => handleAutoPost("multi")}
            disabled={isPosting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-mono"
          >
            {isPosting ? "Posting..." : "🚀 Post to Both Platforms"}
          </Button>
          <span className="font-mono text-xs text-neutral-600">
            Claude will post to Twitter AND Reddit
          </span>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-mono font-bold text-sm text-green-800 mb-2">
            ✅ Success!
          </h3>
          <pre className="font-mono text-xs text-green-700 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-mono font-bold text-sm text-red-800 mb-2">
            ❌ Error
          </h3>
          <p className="font-mono text-xs text-red-700">{error}</p>
          <p className="font-mono text-xs text-red-600 mt-2">
            💡 Make sure you've connected Twitter/Reddit in the Integrations
            page first!
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-mono font-bold text-sm mb-2">
          📝 Before Testing:
        </h3>
        <ul className="font-mono text-xs text-neutral-700 space-y-1 list-disc list-inside">
          <li>Connect Twitter/Reddit in the Integrations page</li>
          <li>Set up your .env.local with API keys</li>
          <li>Make sure ANTHROPIC_API_KEY is configured</li>
          <li>Posts will be created by Claude AI automatically</li>
        </ul>
      </div>
    </Card>
  );
}

/**
 * How to use this component:
 * 
 * 1. Add to your Posts page:
 * 
 * import { ComposioAutomationDemo } from "@/components/composio-automation-demo";
 * 
 * export default function PostsPage() {
 *   return (
 *     <div className="space-y-8">
 *       <h1>Automated Posts</h1>
 *       <ComposioAutomationDemo />
 *     </div>
 *   );
 * }
 * 
 * 2. Or create a dedicated testing page:
 * 
 * // app/dashboard/automation-test/page.tsx
 * import { ComposioAutomationDemo } from "@/components/composio-automation-demo";
 * 
 * export default function AutomationTestPage() {
 *   return <ComposioAutomationDemo />;
 * }
 */


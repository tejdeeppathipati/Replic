"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProjects } from "@/lib/projects-context";

/**
 * Twitter Test Component
 * Simple UI to test posting to Twitter via Composio
 */
export function TwitterTestPost() {
  const { userId: authenticatedUserId } = useProjects();
  const [message, setMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const maxLength = 280;

  const handlePost = async () => {
    if (!message.trim()) {
      alert("Please enter a message to post!");
      return;
    }

    if (message.length > maxLength) {
      alert(`Tweet is too long! Maximum ${maxLength} characters.`);
      return;
    }

    setIsPosting(true);
    setError(null);
    setResult(null);

    try {
      if (!authenticatedUserId) {
        throw new Error("User not authenticated");
      }

      console.log("🐦 [TWITTER TEST] Posting tweet...");
      console.log("   Message:", message);
      console.log("   User ID:", authenticatedUserId);

      const response = await fetch("/api/composio/post-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authenticatedUserId,
          text: message,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to post tweet");
      }

      console.log("✅ [TWITTER TEST] Tweet posted successfully!");
      console.log("   Result:", data);

      setResult(data);
      setMessage(""); // Clear the message
      alert("✅ Tweet posted successfully!\n\nCheck your Twitter account!");
    } catch (err: any) {
      console.error("❌ [TWITTER TEST] Error:", err);
      setError(err.message);
      alert(`❌ Failed to post tweet\n\n${err.message}\n\nMake sure Twitter is connected in Integrations!`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="font-mono text-xl font-bold mb-2">🐦 Test Twitter Post</h2>
          <p className="font-mono text-sm text-neutral-600">
            Write a message and post it directly to your connected Twitter account
          </p>
        </div>

        {/* Tweet Input */}
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's happening?"
            className="w-full min-h-[120px] p-4 border border-neutral-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            maxLength={maxLength}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="font-mono text-xs text-neutral-500">
              {message.length}/{maxLength} characters
            </span>
            {message.length > maxLength && (
              <span className="font-mono text-xs text-red-600">
                ⚠️ Too long! Reduce by {message.length - maxLength}
              </span>
            )}
          </div>
        </div>

        {/* Post Button */}
        <Button
          onClick={handlePost}
          disabled={isPosting || !message.trim() || message.length > maxLength}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono"
        >
          {isPosting ? "Posting to Twitter..." : "🐦 Post Tweet"}
        </Button>

        {/* Success Result */}
        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-mono font-bold text-sm text-green-800 mb-2">
              ✅ Tweet Posted Successfully!
            </h3>
            <div className="font-mono text-xs text-green-700">
              <p className="mb-2">
                <strong>Tweet ID:</strong> {result.tweetId || "N/A"}
              </p>
              {result.url && (
                <p>
                  <strong>View on Twitter:</strong>{" "}
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    {result.url}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-mono font-bold text-sm text-red-800 mb-2">
              ❌ Error Posting Tweet
            </h3>
            <p className="font-mono text-xs text-red-700">{error}</p>
            <p className="font-mono text-xs text-red-600 mt-2">
              💡 Make sure Twitter is connected in the{" "}
              <a href="/dashboard/integrations" className="underline">
                Integrations
              </a>{" "}
              page!
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-mono font-bold text-sm mb-2">ℹ️ How This Works</h3>
          <ul className="font-mono text-xs text-neutral-700 space-y-1 list-disc list-inside">
            <li>This uses your connected Twitter account via Composio</li>
            <li>The tweet will be posted to your actual Twitter timeline</li>
            <li>Maximum 280 characters (Twitter's limit)</li>
            <li>Make sure Twitter is connected in Integrations page</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}


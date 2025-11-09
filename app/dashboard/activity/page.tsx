"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Activity, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ActivityFeedPage() {
  const [brandId, setBrandId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [tweetUrl, setTweetUrl] = useState<string | null>(null);

  const handleGenerateAndPost = async () => {
    if (!brandId.trim()) {
      setMessage({ type: "error", text: "Please enter your Brand ID" });
      return;
    }

    setLoading(true);
    setMessage(null);
    setGeneratedPost(null);
    setTweetUrl(null);

    try {
      const response = await fetch(`http://localhost:8500/post-now/${brandId.trim()}`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate and post");
      }

      const data = await response.json();

      if (data.posted && data.tweet_url) {
        setGeneratedPost(data.post_text);
        setTweetUrl(data.tweet_url);
        setMessage({ 
          type: "success", 
          text: "🎉 Post generated and published to X!" 
        });
      } else {
        setGeneratedPost(data.post_text);
        setMessage({ 
          type: "error", 
          text: data.error || "Post generated but failed to publish" 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to generate post. Make sure daily-poster service is running on port 8500." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-1">Activity Feed</h1>
        <p className="text-sm text-neutral-600">Generate and post content to X</p>
      </div>

      {/* Generate & Post Card */}
      <Card className="p-6 border border-neutral-300">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-lg">Generate & Post</h2>
          </div>
          
          <p className="text-sm text-neutral-600">
            Enter your Brand ID to generate an AI-powered post and publish it to X
          </p>

          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter Brand ID (UUID from Supabase)"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={handleGenerateAndPost}
              disabled={loading || !brandId.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate & Post
                </>
              )}
            </Button>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`flex items-start gap-2 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">{message.text}</p>
                {generatedPost && (
                  <p className="mt-2 text-sm italic">"{generatedPost}"</p>
                )}
                {tweetUrl && (
                  <a
                    href={tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm underline hover:no-underline"
                  >
                    View on X →
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-neutral-500 space-y-1">
            <p>💡 <strong>Tip:</strong> Your Brand ID is in Supabase → brand_agent table</p>
            <p>🔧 <strong>Make sure:</strong> daily-poster service is running on port 8500</p>
          </div>
        </div>
      </Card>

      {/* Empty State */}
      <Card className="p-12 border border-dashed border-neutral-300 bg-neutral-50">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-neutral-200 rounded-xl mb-4">
            <Activity className="h-6 w-6 text-neutral-600" />
          </div>
          <p className="text-neutral-700 font-semibold mb-1">No activity yet</p>
          <p className="text-sm text-neutral-500">Your agent's posts, replies, and engagements will appear here in real-time</p>
        </div>
      </Card>
    </div>
  );
}

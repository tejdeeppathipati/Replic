"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Activity, Sparkles, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Brand = {
  id: string;
  brand_name: string;
  name: string;
};

export default function ActivityFeedPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [userInput, setUserInput] = useState("");
  const [tone, setTone] = useState("engaging");
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [tweetUrl, setTweetUrl] = useState<string | null>(null);

  // Fetch brands on component mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData.user) {
          setMessage({ type: "error", text: "Please log in to view your brands" });
          return;
        }

        const { data, error } = await supabase
          .from("brand_agent")
          .select("id, brand_name, name")
          .eq("user_id", userData.user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching brands:", error);
          setMessage({ type: "error", text: "Failed to load brands" });
        } else {
          const brandsData = (data || []) as Brand[];
          setBrands(brandsData);
          // Auto-select first brand if available
          if (brandsData.length > 0) {
            setBrandId(brandsData[0].id);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  const handleGenerateAndPost = async () => {
    if (!brandId.trim()) {
      setMessage({ type: "error", text: "Please select a brand" });
      return;
    }

    if (!userInput.trim()) {
      setMessage({ type: "error", text: "Please provide a post idea or topic" });
      return;
    }

    setLoading(true);
    setMessage(null);
    setGeneratedPost(null);
    setTweetUrl(null);

    try {
      const dailyPosterUrl = process.env.NEXT_PUBLIC_DAILY_POSTER_URL || process.env.DAILY_POSTER_URL || "http://localhost:8500";
      const response = await fetch(`${dailyPosterUrl}/post-now/${brandId.trim()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_input: userInput.trim(),
          tone: tone,
        }),
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
            Provide your post idea and let AI craft the perfect tweet for your brand
          </p>

          {loadingBrands ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-sm text-neutral-600">Loading your brands...</span>
            </div>
          ) : brands.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No active brands found. Please create a brand first in your dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Brand Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Brand
                </label>
                <Select value={brandId} onValueChange={setBrandId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => {
                      const displayName = brand.brand_name && brand.brand_name.length < 50 
                        ? brand.brand_name 
                        : brand.name;
                      
                      return (
                        <SelectItem key={brand.id} value={brand.id}>
                          {displayName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Post Idea Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Post Idea / Topic <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={loading}
                  placeholder="E.g., 'Announce our new AI feature that helps users save 5 hours/week' or 'Share productivity tips for remote workers' or 'Promote our Black Friday sale'"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tone
                </label>
                <Select value={tone} onValueChange={setTone} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engaging">🎯 Engaging - Hook readers with curiosity</SelectItem>
                    <SelectItem value="professional">💼 Professional - Clear and authoritative</SelectItem>
                    <SelectItem value="casual">😊 Casual - Friendly and conversational</SelectItem>
                    <SelectItem value="inspiring">✨ Inspiring - Motivational and uplifting</SelectItem>
                    <SelectItem value="humorous">😄 Humorous - Light and witty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateAndPost}
                disabled={loading || !brandId.trim() || !userInput.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
          )}

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
                <Check className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <X className="h-5 w-5 shrink-0 mt-0.5" />
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
            <p>💡 <strong>Tip:</strong> Be specific with your post idea - the more detail, the better the result!</p>
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

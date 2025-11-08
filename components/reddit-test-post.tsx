"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProjects } from "@/lib/projects-context";

/**
 * Reddit Test Component
 * Simple UI to test posting to Reddit via Composio
 */
export function RedditTestPost() {
  const { currentProject } = useProjects();
  const [postType, setPostType] = useState<"self" | "link">("self");
  const [subreddit, setSubreddit] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = currentProject?.id || "default";

  const handlePost = async () => {
    if (!subreddit.trim() || !title.trim()) {
      alert("Please enter subreddit and title!");
      return;
    }

    if (postType === "self" && !text.trim()) {
      alert("Please enter post text!");
      return;
    }

    if (postType === "link" && !url.trim()) {
      alert("Please enter URL!");
      return;
    }

    setIsPosting(true);
    setError(null);
    setResult(null);

    try {
      console.log("🔶 [REDDIT TEST] Creating Reddit post...");
      console.log("   Subreddit:", subreddit);
      console.log("   Title:", title);
      console.log("   Type:", postType);

      const response = await fetch("/api/composio/post-reddit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subreddit,
          title,
          kind: postType,
          text: postType === "self" ? text : undefined,
          url: postType === "link" ? url : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to create Reddit post");
      }

      console.log("✅ [REDDIT TEST] Post created successfully!");
      console.log("   Result:", data);

      setResult(data);
      // Clear form
      setSubreddit("");
      setTitle("");
      setText("");
      setUrl("");
      alert("✅ Reddit post created successfully!\n\nCheck the subreddit!");
    } catch (err: any) {
      console.error("❌ [REDDIT TEST] Error:", err);
      setError(err.message);
      alert(`❌ Failed to create Reddit post\n\n${err.message}\n\nMake sure Reddit is connected in Integrations!`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="font-mono text-xl font-bold mb-2">🔶 Test Reddit Post</h2>
          <p className="font-mono text-sm text-neutral-600">
            Create a post on Reddit via your connected account
          </p>
        </div>

        {/* Post Type Selector */}
        <div>
          <label className="font-mono text-sm font-semibold block mb-2">Post Type</label>
          <div className="flex gap-2">
            <Button
              onClick={() => setPostType("self")}
              variant={postType === "self" ? "default" : "outline"}
              className="font-mono"
            >
              Text Post
            </Button>
            <Button
              onClick={() => setPostType("link")}
              variant={postType === "link" ? "default" : "outline"}
              className="font-mono"
            >
              Link Post
            </Button>
          </div>
        </div>

        {/* Subreddit Input */}
        <div>
          <label className="font-mono text-sm font-semibold block mb-2">
            Subreddit (without r/)
          </label>
          <input
            type="text"
            value={subreddit}
            onChange={(e) => setSubreddit(e.target.value)}
            placeholder="python"
            className="w-full p-3 border border-neutral-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Title Input */}
        <div>
          <label className="font-mono text-sm font-semibold block mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="An interesting title"
            className="w-full p-3 border border-neutral-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Conditional Content Input */}
        {postType === "self" ? (
          <div>
            <label className="font-mono text-sm font-semibold block mb-2">Post Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your post content here..."
              className="w-full min-h-[120px] p-4 border border-neutral-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
        ) : (
          <div>
            <label className="font-mono text-sm font-semibold block mb-2">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full p-3 border border-neutral-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}

        {/* Post Button */}
        <Button
          onClick={handlePost}
          disabled={isPosting || !subreddit.trim() || !title.trim()}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-mono"
        >
          {isPosting ? "Posting to Reddit..." : "🔶 Post to Reddit"}
        </Button>

        {/* Success Result */}
        {result && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-mono font-bold text-sm text-orange-800 mb-2">
              ✅ Reddit Post Created!
            </h3>
            <div className="font-mono text-xs text-orange-700">
              <p className="mb-2">
                <strong>Post ID:</strong> {result.postId || "N/A"}
              </p>
              {result.url && (
                <p>
                  <strong>View on Reddit:</strong>{" "}
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-orange-600"
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
              ❌ Error Creating Post
            </h3>
            <p className="font-mono text-xs text-red-700">{error}</p>
            <p className="font-mono text-xs text-red-600 mt-2">
              💡 Make sure Reddit is connected in the{" "}
              <a href="/dashboard/integrations" className="underline">
                Integrations
              </a>{" "}
              page!
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="font-mono font-bold text-sm mb-2">ℹ️ How This Works</h3>
          <ul className="font-mono text-xs text-neutral-700 space-y-1 list-disc list-inside">
            <li>Uses your connected Reddit account via Composio</li>
            <li>Posts to the specified subreddit (check rules first!)</li>
            <li>Text posts include body text, link posts include URL</li>
            <li>Make sure Reddit is connected in Integrations page</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}


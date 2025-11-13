"use client";

import { useState, useEffect, useCallback } from "react";
import { useProjects } from "@/lib/projects-context";
import { MessageSquare, Send, CheckCircle, XCircle, Clock, TrendingUp, BarChart3 } from "lucide-react";

type ReplyQueueItem = {
  id: string;
  reply_text: string;
  original_tweet_text: string;
  original_author: string;
  status: "queued" | "posting" | "posted" | "failed";
  reply_tone: string;
  reply_type: string;
  created_at: string;
  error_message?: string;
};

type PostedReply = {
  id: string;
  reply_text: string;
  original_tweet_text: string;
  original_author: string;
  reply_tweet_id: string;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  views_count: number;
  posted_at: string;
};

type AutoReplyStats = {
  queued: number;
  posted: number;
  failed: number;
  totalPosted: number;
  monitored: number;
  relevant: number;
  successRate: number;
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
  };
};

export default function AutoRepliesPage() {
  const { currentProject, isLoading: projectsLoading } = useProjects();
  const brandId = currentProject?.id || "";

  const [stats, setStats] = useState<AutoReplyStats | null>(null);
  const [queue, setQueue] = useState<ReplyQueueItem[]>([]);
  const [posted, setPosted] = useState<PostedReply[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "posted" | "analytics" | "activity">("activity");
  const [findingReply, setFindingReply] = useState(false);
  const [previewData, setPreviewData] = useState<{
    tweet: any;
    reply: any;
    show: boolean;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch data function - defined BEFORE useEffect that uses it
  const fetchData = useCallback(async () => {
    if (!brandId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get auth token for API calls
      const { createSupabaseClient } = await import('@/lib/supabase');
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      const authHeaders = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      // Fetch stats
      const statsRes = await fetch(`/api/auto-replies/stats?brandId=${brandId}`, {
        headers: authHeaders,
        credentials: "include",
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch queue
      const queueRes = await fetch(`/api/auto-replies/queue?brandId=${brandId}`, {
        headers: authHeaders,
        credentials: "include",
      });
      const queueData = await queueRes.json();
      if (queueData.success) {
        setQueue(queueData.replies || []);
      }

      // Fetch posted
      const postedRes = await fetch(`/api/auto-replies/posted?brandId=${brandId}&limit=20`, {
        headers: authHeaders,
        credentials: "include",
      });
      const postedData = await postedRes.json();
      if (postedData.success) {
        setPosted(postedData.replies || []);
      }

      // Fetch live activity
      const activityRes = await fetch(`/api/auto-replies/activity?brandId=${brandId}&limit=30`, {
        headers: authHeaders,
        credentials: "include",
      });
      const activityData = await activityRes.json();
      if (activityData.success) {
        setActivities(activityData.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch auto-reply data:", error);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  // useEffect to fetch data when brandId or projectsLoading changes
  useEffect(() => {
    // Wait for projects to load before fetching data
    if (projectsLoading) {
      return;
    }
    
    if (brandId) {
      fetchData();
      // Refresh every 5 seconds for live updates
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    } else {
      // No brand selected - clear data
      setLoading(false);
      setStats(null);
      setQueue([]);
      setPosted([]);
      setActivities([]);
    }
  }, [brandId, projectsLoading, fetchData]);

  const handleFindAndReply = async () => {
    if (!brandId) {
      setMessage({ type: "error", text: "Please select a project first" });
      return;
    }

    try {
      setFindingReply(true);
      setMessage(null);

      // Get auth token for API call
      const { createSupabaseClient } = await import('@/lib/supabase');
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      // Step 1: Find and generate reply
      const response = await fetch("/api/auto-replies/find-and-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ brandId }),
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        // Show more detailed error message
        const errorMsg = data.error || data.message || "Failed to find and reply";
        console.error("Find & Reply error:", errorMsg);
        throw new Error(errorMsg);
      }

      // Show preview
      setPreviewData({
        tweet: data.tweet,
        reply: data.reply,
        show: true,
      });

      // If already posted, show success
      if (data.posted) {
        setMessage({
          type: "success",
          text: data.message || "Reply sent successfully!",
        });
        // Refresh data
        setTimeout(() => {
          fetchData();
          setPreviewData(null);
        }, 2000);
      }

    } catch (error: any) {
      console.error("Find & Reply error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to find and reply. Please try again.",
      });
    } finally {
      setFindingReply(false);
    }
  };

  const handleConfirmReply = async () => {
    if (!brandId || !previewData) return;

    try {
      setFindingReply(true);
      setMessage(null);

      // Get auth token for API call
      const { createSupabaseClient } = await import('@/lib/supabase');
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      // Post the reply
      const response = await fetch(`/api/auto-replies/post-reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          brandId,
          tweetId: previewData.tweet.id,
          replyText: previewData.reply.text,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to post reply");
      }

      setMessage({
        type: "success",
        text: "Reply sent successfully!",
      });

      setPreviewData(null);
      
      // Refresh data
      setTimeout(() => {
        fetchData();
      }, 1000);

    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to post reply",
      });
    } finally {
      setFindingReply(false);
    }
  };

  // Show loading state while projects are loading
  if (projectsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-neutral-700 dark:text-neutral-200" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Auto-Replies</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Show message if no brand selected
  if (!brandId) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-neutral-700 dark:text-neutral-200" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Auto-Replies</h1>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <p className="text-neutral-700 dark:text-neutral-200 font-semibold mb-1">No Project Selected</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Please select a project from the dropdown above to view auto-reply data
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching data
  if (loading && !stats) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-neutral-700 dark:text-neutral-200" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Auto-Replies</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading auto-reply data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-neutral-700 dark:text-neutral-200" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Auto-Replies</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFindAndReply}
            disabled={findingReply}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {findingReply ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Finding & Replying...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Find & Reply
              </>
            )}
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{message.text}</p>
            <button
              onClick={() => setMessage(null)}
              className="text-current opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewData && previewData.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Preview Reply</h3>
            
            {/* Original Tweet */}
            <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <p className="text-sm text-neutral-500 mb-2">Original Tweet:</p>
              <p className="text-neutral-900 dark:text-white">{previewData.tweet.text}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                {previewData.tweet.author && <span>@{previewData.tweet.author}</span>}
                {previewData.tweet.score && (
                  <span>• Score: {previewData.tweet.score.toFixed(2)}</span>
                )}
                {previewData.tweet.trigger && (
                  <span>• {previewData.tweet.trigger}</span>
                )}
              </div>
            </div>

            {/* Generated Reply */}
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-neutral-500 mb-2">Generated Reply:</p>
              <p className="text-neutral-900 dark:text-white">{previewData.reply.text}</p>
              {previewData.reply.tone && (
                <p className="mt-2 text-xs text-neutral-500">
                  Tone: {previewData.reply.tone}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReply}
                disabled={findingReply}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {findingReply ? "Posting..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Queued</p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.queued}</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Posted</p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.posted}</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Failed</p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.failed}</p>
          </div>
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Success Rate</p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.successRate}%</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "activity"
                ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            🔴 Live Activity ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "queue"
                ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Reply Queue ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab("posted")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "posted"
                ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Posted Replies ({posted.length})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "analytics"
                ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              🔴 Live updates every 5 seconds
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-neutral-500">Live</span>
            </div>
          </div>
          {activities.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 text-center">
              <MessageSquare className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400">No activity yet</p>
              <p className="text-sm text-neutral-500 mt-2">
                Activity will appear here as the system monitors tweets, generates replies, and posts them.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, idx) => (
                <div
                  key={`${activity.type}-${activity.id}-${idx}`}
                  className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 animate-in fade-in slide-in-from-top-2"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {activity.label}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {activity.type === "monitored" && (
                        <div className="space-y-2">
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">
                            "{activity.text}"
                          </p>
                          <div className="flex items-center gap-3 text-xs text-neutral-500">
                            {activity.author && <span>@{activity.author}</span>}
                            {activity.trigger && <span>• {activity.trigger}</span>}
                            {activity.score && <span>• Score: {parseFloat(activity.score).toFixed(2)}</span>}
                            <span className={`px-2 py-1 rounded ${
                              activity.status === "replied" ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400" :
                              activity.status === "skipped" ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400" :
                              "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                        </div>
                      )}

                      {activity.type === "queued" && (
                        <div className="space-y-2">
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">
                            <span className="font-semibold">Reply:</span> "{activity.text}"
                          </p>
                          {activity.original && (
                            <p className="text-xs text-neutral-500 italic">
                              To: "{activity.original.substring(0, 100)}..."
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-neutral-500">
                            {activity.author && <span>@{activity.author}</span>}
                            <span className={`px-2 py-1 rounded ${
                              activity.status === "queued" ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" :
                              activity.status === "posting" ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400" :
                              activity.status === "posted" ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400" :
                              "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                        </div>
                      )}

                      {activity.type === "posted" && (
                        <div className="space-y-2">
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">
                            <span className="font-semibold">Posted:</span> "{activity.text}"
                          </p>
                          {activity.original && (
                            <p className="text-xs text-neutral-500 italic">
                              To: "{activity.original.substring(0, 100)}..."
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs">
                            {activity.author && <span className="text-neutral-500">@{activity.author}</span>}
                            {activity.tweet_id && (
                              <a
                                href={`https://x.com/i/web/status/${activity.tweet_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                View on X
                              </a>
                            )}
                            <div className="flex items-center gap-3 text-neutral-500">
                              {activity.likes > 0 && <span>❤️ {activity.likes}</span>}
                              {activity.retweets > 0 && <span>🔄 {activity.retweets}</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "queue" && (
        <div className="space-y-4">
          {queue.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 text-center">
              <MessageSquare className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400">No replies in queue</p>
            </div>
          ) : (
            queue.map((reply) => (
              <div
                key={reply.id}
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {reply.status === "queued" && (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                    {reply.status === "posting" && (
                      <Send className="h-4 w-4 text-yellow-500 animate-spin" />
                    )}
                    {reply.status === "posted" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {reply.status === "failed" && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-semibold capitalize">{reply.status}</span>
                    {reply.reply_tone && (
                      <span className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">
                        {reply.reply_tone}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500">
                    {new Date(reply.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Original Tweet:</p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      {reply.original_tweet_text}
                    </p>
                    {reply.original_author && (
                      <p className="text-xs text-neutral-500 mt-1">@{reply.original_author}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Reply:</p>
                    <p className="text-sm text-neutral-900 dark:text-white">
                      {reply.reply_text}
                    </p>
                  </div>
                  {reply.error_message && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Error: {reply.error_message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "posted" && (
        <div className="space-y-4">
          {posted.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 text-center">
              <Send className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400">No posted replies yet</p>
            </div>
          ) : (
            posted.map((reply) => (
              <div
                key={reply.id}
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold">Posted</span>
                    {reply.reply_tweet_id && (
                      <a
                        href={`https://x.com/i/web/status/${reply.reply_tweet_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View on X
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500">
                    {new Date(reply.posted_at).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Original Tweet:</p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      {reply.original_tweet_text}
                    </p>
                    {reply.original_author && (
                      <p className="text-xs text-neutral-500 mt-1">@{reply.original_author}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Reply:</p>
                    <p className="text-sm text-neutral-900 dark:text-white">
                      {reply.reply_text}
                    </p>
                  </div>
                  <div className="flex gap-4 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-neutral-500">❤️</span>
                      <span className="text-sm font-semibold">{reply.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-neutral-500">🔄</span>
                      <span className="text-sm font-semibold">{reply.retweets_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-neutral-500">💬</span>
                      <span className="text-sm font-semibold">{reply.replies_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-neutral-500">👁️</span>
                      <span className="text-sm font-semibold">{reply.views_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "analytics" && stats && (
        <div className="space-y-6">
          {/* Engagement Overview */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Engagement Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Likes</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats.engagement.likes.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Retweets</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats.engagement.retweets.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Replies</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats.engagement.replies.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Views</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats.engagement.views.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* System Stats */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">System Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Monitored</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {stats.monitored.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Relevant Tweets</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {stats.relevant.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Posted</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                  {stats.totalPosted.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


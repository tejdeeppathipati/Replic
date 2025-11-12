"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, ArrowUpRight, Clock, Target, Heart, Repeat2, MessageCircle, Eye, TrendingUp, Loader2, ExternalLink } from "lucide-react";
import { useProjects } from "@/lib/projects-context";
import Link from "next/link";

type DashboardStats = {
  pendingActions: number;
  completedActions: number;
  pausedActions: number;
  totalPosts: number;
  failedPosts: number;
  successRate: number | null;
  queuedPosts: number;
};

type EngagementMetrics = {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  total: number;
};

type RecentPost = {
  id: string;
  text: string;
  tweet_id: string | null;
  tweet_url: string | null;
  posted_at: string;
  source: string;
  action_type: string | null;
  engagement?: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
    total: number;
  };
};

export default function DashboardPage() {
  const { currentProject, projects, isLoading: projectsLoading } = useProjects();
  const brandId = currentProject?.id || "";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [engagementLoading, setEngagementLoading] = useState(false);

  // Fetch dashboard stats
  const fetchStats = async () => {
    if (!brandId) {
      setLoading(false);
      setStats(null);
      setRecentPosts([]);
      return;
    }

    try {
      setLoading(true);

      // Get the auth token from Supabase
      const { createSupabaseClient } = await import('@/lib/supabase');
      const supabase = createSupabaseClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No active session');
      }

      const response = await fetch(`/api/dashboard/stats?brandId=${brandId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.stats || null);
        setRecentPosts(data.recentPosts || []);
        
        // Fetch engagement metrics if we have tweet IDs
        if (data.tweetIds && data.tweetIds.length > 0) {
          fetchEngagement(data.tweetIds);
        } else {
          setEngagement(null);
        }
      } else {
        // API returned error
        setStats(null);
        setRecentPosts([]);
        console.error("API error:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setStats(null);
      setRecentPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch engagement metrics
  const fetchEngagement = async (tweetIds: string[]) => {
    if (!brandId || tweetIds.length === 0) return;

    try {
      setEngagementLoading(true);

      // Get the auth token from Supabase
      const { createSupabaseClient } = await import('@/lib/supabase');
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch("/api/dashboard/engagement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ brandId, tweetIds }),
      });

      const data = await response.json();

      if (data.success) {
        setEngagement(data.totals);

        // Merge engagement data into recent posts
        setRecentPosts((prev) =>
          prev.map((post) => ({
            ...post,
            engagement: post.tweet_id ? data.metrics[post.tweet_id] : undefined,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch engagement:", error);
    } finally {
      setEngagementLoading(false);
    }
  };

  useEffect(() => {
    if (brandId) {
      fetchStats();
    }
  }, [brandId]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!brandId) return;

    const interval = setInterval(() => {
      fetchStats();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [brandId]);

  // If no projects exist and not loading, show empty state with CTA
  if (!projectsLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-6">
            <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <h1 className="font-mono text-3xl font-bold mb-2">Welcome to Replic</h1>
          <p className="text-neutral-600 mb-8">Let's set up your brand profile to get started with AI-powered automation</p>
          <Link href="/onboarding">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-sm">
              Start Setup
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate engagement trend (placeholder for now)
  const engagementTrend = engagement ? "+12%" : null;

  // Find top performing post
  const topPost = recentPosts
    .filter((post) => post.engagement)
    .sort((a, b) => (b.engagement?.total || 0) - (a.engagement?.total || 0))[0];

  // Show message if no project selected
  if (!brandId && !projectsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-mono text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-neutral-600">Real-time insights for your AI agent</p>
        </div>
        <Card className="p-12 border border-dashed border-neutral-300 bg-neutral-50">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-neutral-200 rounded-xl mb-4">
              <Target className="h-6 w-6 text-neutral-600" />
            </div>
            <p className="text-neutral-700 font-semibold mb-1">No Project Selected</p>
            <p className="text-sm text-neutral-500 mb-4">
              Please select a project from the dropdown above to view dashboard stats
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-neutral-600">Real-time insights for your AI agent</p>
        </div>
        <Button
          onClick={fetchStats}
          variant="outline"
          size="sm"
          className="font-mono"
          disabled={loading || !brandId}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Engagement Card */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:border-blue-200 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-8">
            <div className="p-3 bg-blue-100 rounded-xl">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            {engagementTrend && (
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                <ArrowUpRight className="h-3 w-3" />
                {engagementTrend}
              </div>
            )}
            {engagementLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-sm text-neutral-600 mb-1">Total Engagements</p>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            ) : (
              <p className="text-4xl font-bold text-neutral-900">
                {engagement?.total || engagement?.total === 0 ? engagement.total.toLocaleString() : "—"}
              </p>
            )}
            {engagement && engagement.total > 0 && (
              <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                <span>❤️ {engagement.likes.toLocaleString()}</span>
                <span>🔄 {engagement.retweets.toLocaleString()}</span>
                <span>💬 {engagement.replies.toLocaleString()}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Queued Posts Card */}
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 hover:border-emerald-200 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-8">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Send className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex items-center gap-1 text-neutral-500 text-xs font-semibold">
              <Clock className="h-3 w-3" />
              Pending
            </div>
          </div>
          <div>
            <p className="text-sm text-neutral-600 mb-1">Queued Posts</p>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            ) : (
              <p className="text-4xl font-bold text-neutral-900">
                {stats?.queuedPosts ?? 0}
              </p>
            )}
            {stats && stats.pausedActions > 0 && (
              <p className="text-xs text-neutral-500 mt-1">
                {stats?.pausedActions} paused
              </p>
            )}
          </div>
        </Card>

        {/* Success Rate Card */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:border-purple-200 transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-8">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 text-neutral-500 text-xs font-semibold">
              <Clock className="h-3 w-3" />
              {stats?.successRate !== null ? "Active" : "Ready"}
            </div>
          </div>
          <div>
            <p className="text-sm text-neutral-600 mb-1">Success Rate</p>
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            ) : (
              <p className="text-4xl font-bold text-neutral-900">
                {stats && stats.successRate !== null ? `${stats.successRate}%` : "—"}
              </p>
            )}
            {stats && stats.totalPosts > 0 && (
              <p className="text-xs text-neutral-500 mt-1">
                {stats?.totalPosts} posts • {stats?.failedPosts} failed
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono font-bold text-lg">Recent Activity</h2>
            {engagementLoading && (
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading engagement...
              </div>
            )}
          </div>

          {loading ? (
            <Card className="p-12 border border-dashed border-neutral-300 bg-neutral-50">
              <div className="flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-4" />
                <p className="text-neutral-500 font-mono">Loading dashboard...</p>
              </div>
            </Card>
          ) : recentPosts.length === 0 ? (
            <Card className="p-12 border border-dashed border-neutral-300 bg-neutral-50">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-neutral-200 rounded-xl mb-4">
                  <MessageSquare className="h-6 w-6 text-neutral-600" />
                </div>
                <p className="text-neutral-700 font-semibold mb-1">No activity yet</p>
                <p className="text-sm text-neutral-500 mb-4">
                  Posts and conversations will appear here as your agent becomes active
                </p>
                <Link href="/dashboard/actions">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs">
                    Create Your First Action
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <Card key={post.id} className="p-4 border border-neutral-200 hover:border-neutral-300 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {post.action_type && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-mono">
                            {post.action_type}
                          </span>
                        )}
                        <span className="text-xs text-neutral-500 font-mono">
                          {new Date(post.posted_at).toLocaleDateString()} {new Date(post.posted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 font-mono mb-3 line-clamp-2">
                        {post.text}
                      </p>
                      {post.engagement && (
                        <div className="flex items-center gap-4 text-xs text-neutral-600">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            <span>{post.engagement.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Repeat2 className="h-3 w-3 text-green-500" />
                            <span>{post.engagement.retweets}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3 text-blue-500" />
                            <span>{post.engagement.replies}</span>
                          </div>
                          {post.engagement.views > 0 && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-neutral-400" />
                              <span>{post.engagement.views.toLocaleString()}</span>
                            </div>
                          )}
                          <span className="ml-auto font-semibold text-purple-600">
                            {post.engagement.total} total
                          </span>
                        </div>
                      )}
                    </div>
                    {post.tweet_url && (
                      <a
                        href={post.tweet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <Button variant="outline" size="sm" className="font-mono text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Engagement Breakdown */}
          {engagement && engagement.total > 0 && (
            <Card className="p-5 border border-neutral-200">
              <h3 className="font-mono font-semibold text-sm mb-4">Engagement Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-neutral-600">Likes</span>
                  </div>
                  <span className="text-xs font-semibold">{engagement.likes.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-neutral-600">Retweets</span>
                  </div>
                  <span className="text-xs font-semibold">{engagement.retweets.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-neutral-600">Replies</span>
                  </div>
                  <span className="text-xs font-semibold">{engagement.replies.toLocaleString()}</span>
                </div>
                {engagement.views > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-neutral-400" />
                      <span className="text-xs text-neutral-600">Views</span>
                    </div>
                    <span className="text-xs font-semibold">{engagement.views.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-700">Total</span>
                    <span className="text-xs font-bold text-purple-600">{engagement.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Top Performing Post */}
          {topPost && topPost.engagement && (
            <Card className="p-5 border border-purple-200 bg-purple-50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <h3 className="font-mono font-semibold text-sm">Top Post</h3>
              </div>
              <p className="text-xs text-neutral-700 font-mono mb-3 line-clamp-2">
                {topPost.text}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600">Engagements</span>
                <span className="font-bold text-purple-600">
                  {topPost.engagement.total.toLocaleString()}
                </span>
              </div>
              {topPost.tweet_url && (
                <a
                  href={topPost.tweet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block"
                >
                  <Button variant="outline" size="sm" className="w-full font-mono text-xs">
                    View on X
                  </Button>
                </a>
              )}
            </Card>
          )}

          {/* Project Status */}
          <Card className="p-5 border border-neutral-200">
            <h3 className="font-mono font-semibold text-sm mb-4">Project Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-600">Actions</span>
                <span className="text-xs font-semibold text-green-600">
                  {stats ? `${stats.completedActions} completed` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-600">Posts</span>
                <span className="text-xs font-semibold text-blue-600">
                  {stats ? `${stats.totalPosts} total` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-600">Success Rate</span>
                <span className="text-xs font-semibold text-purple-600">
                  {stats && stats.successRate !== null ? `${stats.successRate}%` : "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-5 border border-neutral-200">
            <h3 className="font-mono font-semibold text-sm mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/dashboard/actions">
                <Button className="w-full font-mono bg-purple-600 hover:bg-purple-700 text-white text-xs h-9">
                  Create Action
                </Button>
              </Link>
              <Link href="/dashboard/activity">
                <Button variant="outline" className="w-full font-mono text-xs h-9">
                  Generate Post
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

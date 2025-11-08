"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Twitter, MessageSquare, Send, Sparkles, TrendingUp, Zap } from "lucide-react";

const activities = [
  { platform: "X", icon: Twitter, post: "Need CRM tools?", status: "Awaiting Review", time: "2m ago", color: "text-[#1D9BF0]" },
  { platform: "Reddit", icon: MessageSquare, post: "Best SaaS tool?", status: "Posted", time: "15m ago", color: "text-orange-600" },
  { platform: "X", icon: Twitter, post: "Looking for automation", status: "Posted", time: "1h ago", color: "text-[#1D9BF0]" },
];

const keywords = [
  { term: "CRM", matches: 12 },
  { term: "startups", matches: 8 },
  { term: "automation", matches: 6 },
  { term: "productivity", matches: 5 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-neutral-600">Monitor your AI agent activity</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-6 bg-white border border-neutral-200 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs font-mono text-green-600">+12%</span>
            </div>
            <div>
              <p className="text-xs font-mono text-neutral-600 mb-1">Replies Today</p>
              <p className="text-2xl font-bold font-mono text-neutral-900">24</p>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-neutral-200 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Send className="h-5 w-5 text-emerald-600" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 font-mono text-xs">Active</Badge>
            </div>
            <div>
              <p className="text-xs font-mono text-neutral-600 mb-1">Posts Scheduled</p>
              <p className="text-2xl font-bold font-mono text-neutral-900">8</p>
              <p className="text-xs text-neutral-500 mt-2">3 posting today</p>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-neutral-200 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-xs font-mono text-amber-600 font-semibold">80%</span>
            </div>
            <div>
              <p className="text-xs font-mono text-neutral-600 mb-3">Daily Limit</p>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: "80%" }} />
              </div>
              <p className="text-xs text-neutral-500 mt-2">6 actions left</p>
            </div>
          </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
          {/* Activity Feed - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-mono font-bold text-xl mb-1">Recent Activity</h2>
                <p className="text-xs text-neutral-600">Posts and conversations</p>
              </div>
            </div>

            {activities.map((activity, i) => (
              <Card key={i} className="p-5 border border-neutral-200 hover:border-neutral-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${activity.color === 'text-[#1D9BF0]' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-semibold text-sm">{activity.platform}</span>
                      <Badge variant="outline" className={`font-mono text-xs ${
                        activity.status === 'Awaiting Review' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                        'bg-green-50 border-green-200 text-green-800'
                      }`}>
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-neutral-500 font-mono ml-auto">
                        {activity.time}
                      </span>
                    </div>
                    <p className="font-mono text-sm text-neutral-700 mb-3">
                      {activity.post}
                    </p>
                    {activity.status === 'Awaiting Review' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="font-mono text-xs text-neutral-600">
                          Review
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs">
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-5">
            {/* Agent Status */}
            <Card className="p-5 border border-neutral-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <h3 className="font-mono font-semibold text-sm">Agent Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-neutral-600">Mode</span>
                  <Badge className="font-mono bg-blue-100 text-blue-800 text-xs">Smart</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-neutral-600">WhatsApp Approval</span>
                  <Badge className="font-mono bg-green-100 text-green-800 text-xs">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-neutral-600">Auto-Post</span>
                  <Badge variant="outline" className="font-mono text-xs">Disabled</Badge>
                </div>
              </div>
            </Card>

            {/* Top Keywords */}
            <Card className="p-5 border border-neutral-200">
              <h3 className="font-mono font-semibold text-sm mb-4">Trending Keywords</h3>
              <div className="space-y-2.5">
                {keywords.map((kw) => (
                  <div key={kw.term} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-neutral-700">{kw.term}</span>
                    <span className="text-xs font-mono text-neutral-500">{kw.matches} hits</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-5 border border-neutral-200">
              <h3 className="font-mono font-semibold text-sm mb-4">Actions</h3>
              <div className="space-y-2">
                <Button className="w-full font-mono bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  <Send className="h-3 w-3 mr-2" />
                  New Post
                </Button>
                <Button variant="outline" className="w-full font-mono text-xs">
                  Test WhatsApp
                </Button>
              </div>
            </Card>
          </div>
      </div>
    </div>
  );
}

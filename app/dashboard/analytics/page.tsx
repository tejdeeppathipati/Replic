"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, MessageCircle, Send, Users, ArrowUp } from "lucide-react";

const dailyReplies = [
  { day: "Mon", count: 18 },
  { day: "Tue", count: 24 },
  { day: "Wed", count: 21 },
  { day: "Thu", count: 27 },
  { day: "Fri", count: 22 },
  { day: "Sat", count: 15 },
  { day: "Sun", count: 12 },
];

const toneUsage = [
  { tone: "Normal", percentage: 45, color: "bg-blue-500" },
  { tone: "Smart", percentage: 30, color: "bg-purple-500" },
  { tone: "Unhinged", percentage: 15, color: "bg-orange-500" },
  { tone: "Technical", percentage: 10, color: "bg-green-500" },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-2">Analytics</h1>
        <p className="font-mono text-muted-foreground">
          Track your engagement performance and AI activity
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Replies", value: "139", change: "+23%", icon: MessageCircle },
          { label: "Posts This Week", value: "21", change: "+8%", icon: Send },
          { label: "Avg Engagement", value: "4.2%", change: "+1.2%", icon: TrendingUp },
          { label: "Followers Gained", value: "+47", change: "+15%", icon: Users },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-mono font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-[#1D9BF0]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold">{metric.value}</div>
              <p className="text-xs font-mono text-[#22C55E] flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3" />
                {metric.change} from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Replies Per Day */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono">Replies Per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyReplies.map((item) => (
                <div key={item.day} className="flex items-center gap-4">
                  <span className="font-mono text-sm font-semibold w-12">
                    {item.day}
                  </span>
                  <div className="flex-1 bg-neutral-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-[#1D9BF0] h-8 rounded-full flex items-center justify-end pr-3"
                      style={{ width: `${(item.count / 30) * 100}%` }}
                    >
                      <span className="font-mono text-xs font-bold text-white">
                        {item.count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tone Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono">Personality Tone Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {toneUsage.map((item) => (
              <div key={item.tone} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">{item.tone}</span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {item.percentage}%
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Daily Post Count */}
      <Card>
        <CardHeader>
          <CardTitle className="font-mono">Daily Post Count</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-4">
            {dailyReplies.map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-[#1D9BF0] rounded-t-md" style={{ height: `${(item.count / 30) * 200}px` }} />
                <span className="font-mono text-xs text-muted-foreground">{item.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Calendar, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";

const stats = [
  {
    title: "Replies Today",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: MessageCircle,
    color: "text-[#1D9BF0]",
  },
  {
    title: "Posts Scheduled",
    value: "8",
    change: "3 today",
    trend: "neutral",
    icon: Calendar,
    color: "text-[#22C55E]",
  },
  {
    title: "Daily Limit Left",
    value: "6",
    change: "of 30",
    trend: "neutral",
    icon: TrendingUp,
    color: "text-purple-600",
  },
];

export function QuickStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold">{stat.value}</div>
            <p className="text-xs font-mono text-muted-foreground flex items-center gap-1 mt-1">
              {stat.trend === "up" && <ArrowUp className="h-3 w-3 text-green-600" />}
              {stat.trend === "down" && <ArrowDown className="h-3 w-3 text-red-600" />}
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

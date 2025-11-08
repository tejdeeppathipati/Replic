"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, TrendingUp } from "lucide-react";

const stats = [
  { label: "Jira Tickets Created", value: "127", icon: CheckCircle, color: "text-emerald-600" },
  { label: "Avg Meeting-to-Action", value: "12 min", icon: Clock, color: "text-sky-600" },
  { label: "Story Evolution Rate", value: "+23%", icon: TrendingUp, color: "text-indigo-600" },
];

export function InsightsSidebar() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg">Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="font-mono text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <span className="font-mono font-bold text-lg">{stat.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg">Memory Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-sm text-muted-foreground mb-4">
            You last discussed: export filters, CSV support, dashboard redesign.
          </p>
          <button className="text-indigo-600 font-mono text-sm hover:underline">
            View Full Memory Timeline
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

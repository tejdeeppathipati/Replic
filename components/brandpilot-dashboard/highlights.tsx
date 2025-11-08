"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

const keywords = [
  { term: "CRM", count: 12 },
  { term: "startups", count: 8 },
  { term: "automation", count: 6 },
  { term: "productivity", count: 5 },
  { term: "SaaS", count: 4 },
];

export function Highlights() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#1D9BF0]" />
            Replies per Hour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { hour: "8-9 AM", count: 3 },
              { hour: "9-10 AM", count: 5 },
              { hour: "10-11 AM", count: 7 },
              { hour: "11-12 PM", count: 9 },
            ].map((item) => (
              <div key={item.hour} className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">
                  {item.hour}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-[#1D9BF0] h-2 rounded-full"
                      style={{ width: `${(item.count / 10) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold w-6 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg">Top Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {keywords.map((keyword) => (
              <div key={keyword.term} className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono">
                  {keyword.term}
                </Badge>
                <span className="font-mono text-sm text-muted-foreground">
                  {keyword.count} matches
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

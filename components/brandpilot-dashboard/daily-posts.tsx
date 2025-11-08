"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Send, MessageSquare } from "lucide-react";

const suggestions = [
  {
    text: "Just shipped a new feature that our customers have been asking for. Sometimes the best roadmap comes from listening. 🚀",
    engagement: "High",
  },
  {
    text: "Hot take: Most startups don't fail because of bad ideas. They fail because they build in a vacuum.",
    engagement: "Medium",
  },
  {
    text: "We're hiring! Looking for a senior engineer who loves building products that people actually use. DM if interested.",
    engagement: "High",
  },
];

export function DailyPosts() {
  return (
    <div className="space-y-4">
      <h2 className="font-mono font-bold text-lg">Daily Post Suggestions</h2>
      {suggestions.map((post, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="font-mono text-sm flex-1">{post.text}</p>
              <span className={`text-xs font-mono px-2 py-1 rounded ${
                post.engagement === "High" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {post.engagement} Engagement
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="font-mono">
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button size="sm" className="bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono">
                <Send className="h-3 w-3 mr-1" />
                Post Now
              </Button>
              <Button variant="outline" size="sm" className="font-mono">
                <MessageSquare className="h-3 w-3 mr-1" />
                Send to WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

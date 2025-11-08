"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Send, MessageSquare, Trash2, Calendar, Twitter } from "lucide-react";

const scheduledPosts = [
  {
    platform: "X",
    text: "Just shipped a new feature that our customers have been asking for. Sometimes the best roadmap comes from listening. 🚀",
    scheduledFor: "Today at 2:00 PM",
    status: "Scheduled",
    engagement: "High",
  },
  {
    platform: "Reddit",
    text: "We're building in public and would love your feedback on our new dashboard redesign. What features matter most to you?",
    scheduledFor: "Tomorrow at 10:00 AM",
    status: "Awaiting Approval",
    engagement: "Medium",
  },
  {
    platform: "X",
    text: "Hot take: Most startups don't fail because of bad ideas. They fail because they build in a vacuum. Talk to your users!",
    scheduledFor: "Tomorrow at 4:00 PM",
    status: "Scheduled",
    engagement: "High",
  },
  {
    platform: "X",
    text: "We're hiring! Looking for a senior engineer who loves building products that people actually use. DM if interested.",
    scheduledFor: "Friday at 9:00 AM",
    status: "Draft",
    engagement: "Medium",
  },
];

export default function PostsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-1">Scheduled Posts</h1>
        <p className="text-sm text-neutral-600">Manage your content calendar</p>
      </div>

      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-sm">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule New Post
        </Button>
      </div>

      <div className="grid gap-4">
        {scheduledPosts.map((post, i) => (
          <Card key={i} className="border border-neutral-200 hover:border-neutral-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs">
                      {post.platform}
                    </Badge>
                    <Badge
                      className={`font-mono text-xs ${
                        post.status === "Scheduled"
                          ? "bg-green-100 text-green-800"
                          : post.status === "Awaiting Approval"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {post.status}
                    </Badge>
                    <span className="text-xs font-mono text-neutral-600">
                      {post.engagement} engagement
                    </span>
                  </div>
                  <p className="font-mono text-sm text-neutral-700 mb-3">{post.text}</p>
                  <p className="text-xs font-mono text-neutral-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.scheduledFor}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-100 flex-wrap">
                <Button variant="outline" size="sm" className="font-mono text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs">
                  <Send className="h-3 w-3 mr-1" />
                  Post Now
                </Button>
                <Button variant="outline" size="sm" className="font-mono text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" className="font-mono text-xs text-red-600 hover:text-red-700">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

        <div className="flex justify-between items-center pt-4">
          <p className="text-sm font-mono text-muted-foreground">
            {scheduledPosts.length} posts in queue
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="font-mono">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="font-mono">
              Next
            </Button>
          </div>
      </div>
    </div>
  );
}

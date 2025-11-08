"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { TwitterTestPost } from "@/components/twitter-test-post";
import { RedditTestPost } from "@/components/reddit-test-post";

export default function PostsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-1">Posts</h1>
        <p className="text-sm text-neutral-600">Create and manage your social media posts</p>
      </div>

      {/* Social Media Test Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TwitterTestPost />
        <RedditTestPost />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="font-mono text-xl font-bold">Scheduled Posts</h2>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-sm">
          <Plus className="h-4 w-4 mr-2" />
          Schedule New Post
        </Button>
      </div>

      {/* Empty State */}
      <Card className="p-12 border border-dashed border-neutral-300 bg-neutral-50">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-neutral-200 rounded-xl mb-4">
            <Calendar className="h-6 w-6 text-neutral-600" />
          </div>
          <p className="text-neutral-700 font-semibold mb-1">No scheduled posts yet</p>
          <p className="text-sm text-neutral-500">Start creating posts and they will appear here with their status and scheduling information</p>
        </div>
      </Card>
    </div>
  );
}

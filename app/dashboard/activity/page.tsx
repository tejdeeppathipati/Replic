"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Twitter, MessageSquare, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const allActivities = [
  {
    platform: "X",
    type: "Reply",
    status: "Posted",
    original: "Need CRM tools for my startup?",
    reply: "Try AcmeCRM – built for founders who need simple, powerful tools.",
    time: "11:20 AM",
    icon: Twitter,
    color: "text-[#1D9BF0]",
  },
  {
    platform: "Reddit",
    type: "Comment",
    status: "Pending",
    original: "What's the best SaaS for small teams?",
    reply: "We built AcmeCRM specifically for small teams. Happy to answer questions!",
    time: "10:55 AM",
    icon: MessageSquare,
    color: "text-orange-600",
  },
  {
    platform: "X",
    type: "Daily Post",
    status: "Skipped",
    original: "Hot take: Most startups don't need enterprise features.",
    reply: "—",
    time: "9:00 AM",
    icon: Twitter,
    color: "text-[#1D9BF0]",
  },
  {
    platform: "Reddit",
    type: "Reply",
    status: "Posted",
    original: "Looking for alternatives to HubSpot",
    reply: "AcmeCRM is a great alternative – no bloat, just what you need.",
    time: "8:30 AM",
    icon: MessageSquare,
    color: "text-orange-600",
  },
  {
    platform: "X",
    type: "Reply",
    status: "Posted",
    original: "Anyone using AI for customer support?",
    reply: "We use AI for initial triage. Works great for common questions.",
    time: "Yesterday",
    icon: Twitter,
    color: "text-[#1D9BF0]",
  },
];

export default function ActivityPage() {
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredActivities = allActivities.filter((activity) => {
    if (filterPlatform !== "all" && activity.platform !== filterPlatform) return false;
    if (filterStatus !== "all" && activity.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-2">Activity Feed</h1>
        <p className="font-mono text-muted-foreground">
          Complete log of all AI-generated replies and posts
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="font-mono">Platform</Label>
            <select
              className="w-full p-2 border rounded-md font-mono text-sm"
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
            >
              <option value="all">All Platforms</option>
              <option value="X">X (Twitter)</option>
              <option value="Reddit">Reddit</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="font-mono">Status</Label>
            <select
              className="w-full p-2 border rounded-md font-mono text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Posted">Posted</option>
              <option value="Pending">Pending</option>
              <option value="Skipped">Skipped</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="font-mono">Date Range</Label>
            <Input type="date" className="font-mono" />
          </div>
        </div>
      </Card>

      {/* Activity Table */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono">Platform</TableHead>
              <TableHead className="font-mono">Type</TableHead>
              <TableHead className="font-mono">Status</TableHead>
              <TableHead className="font-mono">Original</TableHead>
              <TableHead className="font-mono">Reply</TableHead>
              <TableHead className="font-mono">Time</TableHead>
              <TableHead className="font-mono text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActivities.map((activity, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                    <span className="font-mono font-semibold text-sm">
                      {activity.platform}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{activity.type}</TableCell>
                <TableCell>
                  <Badge
                    className={`font-mono ${
                      activity.status === "Posted"
                        ? "bg-[#22C55E]"
                        : activity.status === "Pending"
                        ? "bg-yellow-500"
                        : "bg-neutral-500"
                    }`}
                  >
                    {activity.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm max-w-xs truncate">
                  {activity.original}
                </TableCell>
                <TableCell className="font-mono text-sm max-w-xs truncate text-muted-foreground">
                  {activity.reply}
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {activity.time}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm font-mono text-muted-foreground">
          Showing {filteredActivities.length} of {allActivities.length} activities
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

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Twitter, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const activities = [
  {
    platform: "X",
    icon: Twitter,
    color: "text-[#1D9BF0]",
    post: "Need CRM tools?",
    status: "Awaiting WhatsApp approval",
    statusColor: "bg-yellow-500",
    time: "11:45 AM",
  },
  {
    platform: "Reddit",
    icon: MessageSquare,
    color: "text-orange-600",
    post: "Best SaaS tool?",
    status: "Posted",
    statusColor: "bg-[#22C55E]",
    time: "10:15 AM",
  },
  {
    platform: "X",
    icon: Twitter,
    color: "text-[#1D9BF0]",
    post: "Looking for help",
    status: "Skipped",
    statusColor: "bg-neutral-500",
    time: "9:30 AM",
  },
  {
    platform: "Reddit",
    icon: MessageSquare,
    color: "text-orange-600",
    post: "r/startups discussion",
    status: "Awaiting WhatsApp approval",
    statusColor: "bg-yellow-500",
    time: "9:00 AM",
  },
];

export function MultiPlatformFeed() {
  return (
    <Card className="p-6">
      <h2 className="font-mono font-bold text-lg mb-4">Activity Feed</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono">Platform</TableHead>
            <TableHead className="font-mono">Post</TableHead>
            <TableHead className="font-mono">Status</TableHead>
            <TableHead className="font-mono">Time</TableHead>
            <TableHead className="font-mono text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  <span className="font-mono font-semibold">{activity.platform}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm max-w-xs truncate">
                {activity.post}
              </TableCell>
              <TableCell>
                <Badge className={`${activity.statusColor} font-mono text-white`}>
                  {activity.status}
                </Badge>
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
  );
}

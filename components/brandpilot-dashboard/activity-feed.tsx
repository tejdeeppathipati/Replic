"use client";

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
import { MessageCircle, Send, ExternalLink } from "lucide-react";

const activities = [
  {
    type: "Mention",
    icon: MessageCircle,
    tweet: "Need a CRM for startups?",
    reply: "We built exactly that. Check out our pricing.",
    time: "10:32 AM",
    status: "sent",
  },
  {
    type: "Keyword Match",
    icon: MessageCircle,
    tweet: "CRM tools are so boring.",
    reply: "Not ours. DM us for a demo.",
    time: "9:48 AM",
    status: "sent",
  },
  {
    type: "Daily Post",
    icon: Send,
    tweet: "New day, same grind. Building in public.",
    reply: null,
    time: "8:00 AM",
    status: "posted",
  },
  {
    type: "Mention",
    icon: MessageCircle,
    tweet: "Anyone know good X automation tools?",
    reply: "BrandPilot handles auto-replies and posting. Want a demo?",
    time: "7:15 AM",
    status: "sent",
  },
];

export function ActivityFeed() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono font-bold text-lg">Activity Feed</h2>
        <Button variant="outline" size="sm" className="font-mono">
          View All
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono">Type</TableHead>
            <TableHead className="font-mono">Tweet</TableHead>
            <TableHead className="font-mono">Reply</TableHead>
            <TableHead className="font-mono">Time</TableHead>
            <TableHead className="font-mono text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <activity.icon className="h-4 w-4 text-[#1D9BF0]" />
                  <Badge variant="outline" className="font-mono text-xs">
                    {activity.type}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm max-w-xs truncate">
                {activity.tweet}
              </TableCell>
              <TableCell className="font-mono text-sm max-w-xs truncate text-muted-foreground">
                {activity.reply || "—"}
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

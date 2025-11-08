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

const meetings = [
  {
    title: "Sprint Planning",
    client: "Horizon Logistics",
    date: "Nov 7, 2025",
    summary: "Export filters approved",
    status: "Processed",
  },
  {
    title: "Client Review",
    client: "FintechX",
    date: "Nov 6, 2025",
    summary: "UI redesign requested",
    status: "Processing",
  },
  {
    title: "Discovery Call",
    client: "DataSync Pro",
    date: "Nov 5, 2025",
    summary: "API integration requirements discussed",
    status: "Processed",
  },
  {
    title: "Feature Demo",
    client: "CloudScale",
    date: "Nov 4, 2025",
    summary: "Dashboard analytics feedback",
    status: "Processed",
  },
];

export function MeetingFeed() {
  return (
    <Card className="p-6">
      <h2 className="font-mono font-bold text-lg mb-4">Recent Meetings</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono">Meeting</TableHead>
            <TableHead className="font-mono">Client</TableHead>
            <TableHead className="font-mono">Date</TableHead>
            <TableHead className="font-mono">Summary</TableHead>
            <TableHead className="font-mono">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetings.map((meeting, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono font-semibold">{meeting.title}</TableCell>
              <TableCell className="font-mono">{meeting.client}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{meeting.date}</TableCell>
              <TableCell className="font-mono text-sm">{meeting.summary}</TableCell>
              <TableCell>
                <Badge
                  variant={meeting.status === "Processed" ? "default" : "secondary"}
                  className="font-mono"
                >
                  {meeting.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

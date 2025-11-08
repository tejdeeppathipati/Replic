"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Pause, Send } from "lucide-react";

export function LoopStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#22C55E]" />
          Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm">Status</span>
          <Badge className="bg-[#22C55E] font-mono">
            ✅ Active
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-sm">Mode</span>
          <span className="font-mono text-sm font-semibold">WhatsApp Review Mode</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-sm">Persona</span>
          <Badge variant="outline" className="font-mono">Smart</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-sm">Daily Replies</span>
          <span className="font-mono text-sm font-bold">12 / 30</span>
        </div>

        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-[#1D9BF0] h-2 rounded-full"
            style={{ width: "40%" }}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="font-mono flex-1">
            <Pause className="h-4 w-4 mr-1" />
            Pause Agent
          </Button>
          <Button variant="outline" size="sm" className="font-mono flex-1">
            <Send className="h-4 w-4 mr-1" />
            Test Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

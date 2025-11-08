"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, FileUp, Plug, FileText } from "lucide-react";

const actions = [
  { icon: Calendar, label: "Create Meeting", color: "bg-indigo-600 hover:bg-indigo-700" },
  { icon: FileUp, label: "Upload Transcript", color: "bg-emerald-600 hover:bg-emerald-700" },
  { icon: Plug, label: "Connect Tools", color: "bg-purple-600 hover:bg-purple-700" },
  { icon: FileText, label: "Generate Summary", color: "bg-sky-600 hover:bg-sky-700" },
];

export function QuickActions() {
  return (
    <Card className="p-6">
      <h2 className="font-mono font-bold text-lg mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            className={`${action.color} text-white flex flex-col h-24 gap-2 font-mono`}
          >
            <action.icon className="h-6 w-6" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}

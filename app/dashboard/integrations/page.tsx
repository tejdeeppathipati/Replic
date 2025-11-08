"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Twitter, MessageSquare, CheckCircle } from "lucide-react";

const connectedTools = [
  {
    name: "X (Twitter)",
    description: "Post and engage with your audience",
    icon: Twitter,
    connected: true,
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    name: "Reddit",
    description: "Monitor and reply to conversations",
    icon: MessageSquare,
    connected: true,
    color: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    name: "WhatsApp",
    description: "Review drafts before posting",
    icon: MessageSquare,
    connected: true,
    color: "bg-green-50",
    iconColor: "text-green-600",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-1">Integrations</h1>
        <p className="text-sm text-neutral-600">Manage connected platforms</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
        <span className="text-sm font-mono text-neutral-700">All platforms connected</span>
      </div>

      {/* Grid of Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {connectedTools.map((tool) => (
          <Card key={tool.name} className="p-6 border border-neutral-200 hover:border-neutral-300 transition-colors">
            <div className="mb-4">
              <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center mb-4`}>
                <tool.icon className={`h-6 w-6 ${tool.iconColor}`} />
              </div>
              <h3 className="font-mono font-bold text-base mb-1">{tool.name}</h3>
              <p className="font-mono text-xs text-neutral-600">
                {tool.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {tool.connected && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-mono text-green-600">Connected</span>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

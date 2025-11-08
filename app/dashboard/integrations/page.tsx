"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const integrations = [
  {
    name: "X",
    description: "Connect your X account to post and engage",
    icon: "/icons/twitter.png",
  },
  {
    name: "Reddit",
    description: "Monitor and reply to conversations",
    icon: "/icons/reddit.png",
  },
  {
    name: "WhatsApp",
    description: "Receive drafts and approvals via WhatsApp",
    icon: "/icons/whatsapp.png",
  },
  {
    name: "iMessage",
    description: "Receive alerts and approvals via iMessage",
    icon: "/icons/messages.png",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-1">Integrations</h1>
        <p className="text-sm text-neutral-600">Connect your platforms to get started</p>
      </div>

      {/* Grid of Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {integrations.map((tool) => (
          <Card key={tool.name} className="p-6 border border-neutral-200 hover:border-neutral-300 transition-colors">
            <div className="mb-4">
              <div className="flex items-center justify-center mb-4">
                <Image
                  src={tool.icon}
                  alt={tool.name}
                  width={50}
                  height={50}
                  className="object-contain"
                />
              </div>
              <h3 className="font-mono font-bold text-base mb-1 text-center">{tool.name}</h3>
              <p className="font-mono text-xs text-neutral-600 text-center">
                {tool.description}
              </p>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs">
              Connect
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

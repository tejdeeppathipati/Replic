"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, User, Bot, Check, X } from "lucide-react";

const mockChat = [
  {
    sender: "bot",
    message: 'Draft for X post detected:\n"Need CRM tools for your startup? Try AcmeCRM – built for founders."',
    time: "11:45 AM",
  },
  {
    sender: "user",
    message: "edit shorter",
    time: "11:46 AM",
  },
  {
    sender: "bot",
    message: '"Try AcmeCRM – built for founders." Approve?',
    time: "11:46 AM",
  },
  {
    sender: "user",
    message: "approve",
    time: "11:47 AM",
  },
  {
    sender: "bot",
    message: "✅ Posted to X successfully!",
    time: "11:47 AM",
  },
];

export function WhatsAppChat() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          WhatsApp Review Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {mockChat.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender === "user"
                    ? "bg-[#1D9BF0] text-white"
                    : "bg-neutral-100 text-neutral-900"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.sender === "bot" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="text-xs font-mono font-semibold">
                    {msg.sender === "bot" ? "BrandPilot" : "You"}
                  </span>
                </div>
                <p className="text-sm font-mono whitespace-pre-wrap">{msg.message}</p>
                <span className="text-xs opacity-70 font-mono mt-1 block">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t flex gap-2">
          <Button variant="outline" size="sm" className="font-mono">
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button variant="outline" size="sm" className="font-mono">
            Edit
          </Button>
          <Button variant="outline" size="sm" className="font-mono">
            <X className="h-4 w-4 mr-1" />
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

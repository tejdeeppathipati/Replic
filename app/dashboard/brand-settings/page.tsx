"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Twitter, CheckCircle, Settings2 } from "lucide-react";
import { useState } from "react";

const personalities = [
  { value: "normal", label: "Normal", description: "Friendly and professional" },
  { value: "smart", label: "Smart", description: "Insightful and analytical" },
  { value: "unhinged", label: "Unhinged", description: "Witty and edgy" },
  { value: "technical", label: "Technical", description: "Precise and detailed" },
];

export default function BrandSettingsPage() {
  const [selectedPersonality, setSelectedPersonality] = useState("normal");
  const [autoPost, setAutoPost] = useState(true);
  const [skipSensitive, setSkipSensitive] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold mb-2">Connect Your Tools & Define Your Brand</h1>
          <p className="font-mono text-muted-foreground">
            Link your X account, set your tone, and let BrandPilot handle the rest.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* X Account Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <Twitter className="h-5 w-5 text-[#1D9BF0]" />
              X Account Connection
            </CardTitle>
            <CardDescription className="font-mono">
              Connect your brand's X account via OAuth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Twitter className="h-8 w-8 text-[#1D9BF0]" />
                <div>
                  <p className="font-mono font-semibold">@yourbrand</p>
                  <Badge className="mt-1 bg-[#22C55E] font-mono">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
              </div>
              <Button variant="outline" className="font-mono">
                Manage Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Brand Info & Persona */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono">Brand Info & Persona</CardTitle>
            <CardDescription className="font-mono">
              Define your brand voice and personality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name" className="font-mono">Brand Name</Label>
                <Input
                  id="brand-name"
                  placeholder="Your Brand"
                  className="font-mono"
                  defaultValue="YourBrand"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-mono">Short Description</Label>
                <Input
                  id="description"
                  placeholder="What does your brand do?"
                  className="font-mono"
                  defaultValue="AI-powered productivity tools for startups"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords" className="font-mono">Brand Keywords</Label>
                <Input
                  id="keywords"
                  placeholder="Comma-separated keywords"
                  className="font-mono"
                  defaultValue="CRM, automation, productivity, SaaS"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-mono">Tone Selector</Label>
              <div className="grid grid-cols-2 gap-3">
                {personalities.map((persona) => (
                  <button
                    key={persona.value}
                    onClick={() => setSelectedPersonality(persona.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedPersonality === persona.value
                        ? "border-[#1D9BF0] bg-[#1D9BF0]/5"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <p className="font-mono font-bold text-sm">{persona.label}</p>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      {persona.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="knowledge" className="font-mono">Brand Knowledge</Label>
              <textarea
                id="knowledge"
                placeholder="Add FAQs, website copy, or brand guidelines..."
                className="w-full min-h-32 p-3 border rounded-md font-mono text-sm"
                defaultValue="We're a CRM built for startups. Simple, affordable, and powerful."
              />
            </div>
          </CardContent>
        </Card>

        {/* Safety Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Safety Settings
            </CardTitle>
            <CardDescription className="font-mono">
              Control how BrandPilot engages on your behalf
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-semibold text-sm">Auto-post without approval</p>
                <p className="font-mono text-xs text-muted-foreground">
                  Let AI post and reply automatically
                </p>
              </div>
              <button
                onClick={() => setAutoPost(!autoPost)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  autoPost ? "bg-[#22C55E]" : "bg-neutral-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    autoPost ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-semibold text-sm">Skip political/sensitive topics</p>
                <p className="font-mono text-xs text-muted-foreground">
                  Avoid controversial conversations
                </p>
              </div>
              <button
                onClick={() => setSkipSensitive(!skipSensitive)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  skipSensitive ? "bg-[#22C55E]" : "bg-neutral-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    skipSensitive ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-mono">Daily reply limit</Label>
                <span className="font-mono text-sm font-bold">{dailyLimit}</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Footer */}
      <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between shadow-lg">
        <p className="font-mono text-sm text-muted-foreground">
          Last updated: Today at 2:45 PM
        </p>
        <Button className="bg-[#22C55E] hover:bg-[#16a34a] font-mono">
          Save Settings
        </Button>
      </div>
    </div>
  );
}

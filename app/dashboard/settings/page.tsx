"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, Sparkles, Shield, Twitter } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("brand");

  // Brand Info
  const [brandName, setBrandName] = useState("AcmeCRM");
  const [description, setDescription] = useState("AI-powered CRM for startups");
  const [website, setWebsite] = useState("https://acmecrm.com");

  // Persona & Keywords
  const [persona, setPersona] = useState("smart");
  const [keywords, setKeywords] = useState("CRM, automation, startups");
  const [watchedAccounts, setWatchedAccounts] = useState("@founder, @competitor");

  // Safety
  const [autoPost, setAutoPost] = useState(false);
  const [whatsappDrafts, setWhatsappDrafts] = useState(true);
  const [monitorReddit, setMonitorReddit] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(30);

  const tabs = [
    { id: "brand", label: "Brand Info", icon: Globe },
    { id: "persona", label: "Persona & Keywords", icon: Sparkles },
    { id: "safety", label: "Safety & Review", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-2">Settings</h1>
        <p className="font-mono text-muted-foreground">
          Manage your brand configuration and safety settings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-mono text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#1D9BF0] text-[#1D9BF0]"
                : "border-transparent hover:border-neutral-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Brand Info Tab */}
      {activeTab === "brand" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Brand Information</CardTitle>
              <CardDescription className="font-mono">
                Update your brand details and website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name" className="font-mono">Brand Name</Label>
                <Input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-mono">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="font-mono">Website URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="font-mono flex-1"
                  />
                  <Button variant="outline" className="font-mono">
                    Re-scrape Website
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Persona & Keywords Tab */}
      {activeTab === "persona" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Personality Tone</CardTitle>
              <CardDescription className="font-mono">
                Choose how your AI agent communicates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-3">
                {["normal", "smart", "unhinged", "technical"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPersona(p)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      persona === p
                        ? "border-[#1D9BF0] bg-blue-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <p className="font-mono font-bold text-sm capitalize">{p}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Monitoring</CardTitle>
              <CardDescription className="font-mono">
                Define what to watch for across platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keywords" className="font-mono">Keywords</Label>
                <Input
                  id="keywords"
                  placeholder="Comma-separated"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="watched" className="font-mono">Watched Accounts</Label>
                <Input
                  id="watched"
                  placeholder="@handle, @handle"
                  value={watchedAccounts}
                  onChange={(e) => setWatchedAccounts(e.target.value)}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Safety Tab */}
      {activeTab === "safety" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Approval Workflow</CardTitle>
              <CardDescription className="font-mono">
                Control how posts are reviewed before publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-mono font-semibold">Auto-post without approval</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    Let AI post automatically
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

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-mono font-semibold">Send drafts to WhatsApp</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    Review before posting
                  </p>
                </div>
                <button
                  onClick={() => setWhatsappDrafts(!whatsappDrafts)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    whatsappDrafts ? "bg-[#22C55E]" : "bg-neutral-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      whatsappDrafts ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-mono font-semibold">Monitor Reddit</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    Track relevant subreddits
                  </p>
                </div>
                <button
                  onClick={() => setMonitorReddit(!monitorReddit)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    monitorReddit ? "bg-[#22C55E]" : "bg-neutral-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      monitorReddit ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono">Rate Limits</CardTitle>
              <CardDescription className="font-mono">
                Set daily posting and reply limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-mono">Daily Reply Limit</Label>
                  <span className="font-mono font-bold">{dailyLimit}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-[#22C55E] hover:bg-[#16a34a] font-mono">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

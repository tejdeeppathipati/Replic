"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, ArrowRight, Package } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-1">Settings</h1>
        <p className="text-sm text-neutral-600">Configure your Replic workspace</p>
      </div>

      {/* Redirect to Projects */}
      <Card className="border border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-mono flex items-center gap-2">
                <Package className="h-5 w-5" />
                Project Settings
              </CardTitle>
              <CardDescription className="font-mono mt-2">
                All project configuration including brand info, persona, keywords, and safety settings are managed on the Projects page
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/projects">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-sm">
              Go to Projects
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Workspace Settings Section */}
      <div className="space-y-4">
        <h2 className="font-mono text-xl font-bold">Workspace Settings</h2>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-base">Account & Preferences</CardTitle>
            <CardDescription className="font-mono">
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="font-mono text-sm" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-base">Notifications</CardTitle>
            <CardDescription className="font-mono">
              Configure how you receive alerts and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="font-mono text-sm" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-base">API Keys</CardTitle>
            <CardDescription className="font-mono">
              Manage API access for integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="font-mono text-sm" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

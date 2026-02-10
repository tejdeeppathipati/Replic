"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Twitter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!email.trim()) {
        setError("Email is required");
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) throw resetError;

      setSuccess("Password reset email sent. Check your inbox for the reset link.");
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link href="/" className="flex items-center gap-2">
              <Twitter className="h-10 w-10 text-[#1D9BF0]" />
              <span className="font-mono text-2xl font-bold">Replic</span>
            </Link>
          </div>
          <CardTitle className="font-mono text-2xl">Reset your password</CardTitle>
          <CardDescription className="font-mono">
            We&apos;ll email you a link to set a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            {error && (
              <div
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-mono"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-mono"
                role="status"
                aria-live="polite"
              >
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                autoCapitalize="none"
                className="font-mono"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-mono text-muted-foreground">
              Remembered your password?{" "}
              <Link href="/login" className="text-[#1D9BF0] hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


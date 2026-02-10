"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Twitter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { syncServerSession } from "@/lib/auth";

export default function ResetPasswordPage() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    const check = async () => {
      try {
        // Give Supabase a moment to parse recovery tokens from the URL (hash-based).
        await new Promise((r) => setTimeout(r, 50));
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setHasSession(!!data.session);
        setChecking(false);
      } catch (e) {
        if (!mounted) return;
        setHasSession(false);
        setChecking(false);
      }
    };

    check();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Register updated session cookies for middleware, then send the user to the dashboard.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncServerSession(session.access_token, session.refresh_token, session.expires_in);
      }

      setSuccess("Password updated. Redirecting...");
      window.location.assign("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please request a new reset link.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1D9BF0] mx-auto mb-4" />
          <p className="text-sm text-neutral-600 font-mono">Opening reset link...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
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
            <CardTitle className="font-mono text-2xl">Link expired</CardTitle>
            <CardDescription className="font-mono">
              This reset link is invalid or has expired. Request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button className="w-full bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono">
                Request new reset link
              </Button>
            </Link>
            <div className="mt-6 text-center">
              <p className="text-sm font-mono text-muted-foreground">
                Or{" "}
                <Link href="/login" className="text-[#1D9BF0] hover:underline">
                  log in
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="font-mono text-2xl">Set a new password</CardTitle>
          <CardDescription className="font-mono">Choose a strong password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
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
              <Label htmlFor="password" className="font-mono">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  autoComplete="new-password"
                  className="font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-neutral-500 font-mono">At least 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-mono">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  autoComplete="new-password"
                  className="font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-mono text-muted-foreground">
              Changed your mind?{" "}
              <Link href="/login" className="text-[#1D9BF0] hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


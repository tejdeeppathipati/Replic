"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { syncServerSession } from "@/lib/auth";
import { NEXT_PUBLIC_SUPABASE_HOST } from "@/lib/env-public";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const redirectTo = useMemo(() => {
    const raw = searchParams.get("redirect");
    if (!raw) return "/dashboard";
    if (!raw.startsWith("/")) return "/dashboard";
    if (raw.startsWith("//")) return "/dashboard";
    if (raw.startsWith("/login") || raw.startsWith("/signup")) return "/dashboard";
    return raw;
  }, [searchParams]);

  // Check if user is already logged in and redirect.
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();

        // Try to get session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("❌ Error getting session:", error);
          setIsCheckingAuth(false);
          return;
        }

        if (session) {
          // Ensure middleware can validate the session by registering cookies server-side.
          await syncServerSession(session.access_token, session.refresh_token, session.expires_in);
          // Full reload to ensure middleware sees updated cookies.
          window.location.assign(redirectTo);
          return; // Don't set isCheckingAuth to false, we're redirecting
        }

        // No session found - show login form
        setIsCheckingAuth(false);
      } catch (error) {
        console.error("❌ Error checking auth:", error);
        // On error, show login form
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();

      // Sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.session) {
        await syncServerSession(
          data.session.access_token,
          data.session.refresh_token,
          data.session.expires_in
        );
        window.location.assign(redirectTo);
      } else {
        console.error("❌ No session returned after login");
        setError("Login failed - no session created");
        setLoading(false);
      }
    } catch (err: any) {
      const isFetchError =
        err?.name === "AuthRetryableFetchError" ||
        (typeof err?.message === "string" &&
          (err.message.includes("Failed to fetch") || err.message.includes("fetch")));

      if (isFetchError) {
        const hostHint = NEXT_PUBLIC_SUPABASE_HOST ? ` (${NEXT_PUBLIC_SUPABASE_HOST})` : "";
        setError(
          `Unable to reach Supabase${hostHint}. Check your internet/DNS and verify NEXT_PUBLIC_SUPABASE_URL is correct.`
        );
      } else {
        setError(err.message || "Failed to log in. Please check your credentials.");
      }
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1D9BF0] mx-auto mb-4" />
          <p className="text-sm text-neutral-600 font-mono">Checking your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14">
        <div>
          <Link href="/" className="flex items-center gap-2 w-max">
            <Twitter className="h-9 w-9 text-[#1D9BF0]" />
            <span className="font-mono text-2xl font-bold">Replic</span>
          </Link>
        </div>
        <div className="max-w-xl">
          <h1 className="font-mono text-4xl font-bold leading-tight">
            Your AI agent for X that stays on-brand.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground font-mono">
            Log in to manage your automations, approvals, and posting cadence.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-neutral-700">
            <div className="flex gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#1D9BF0]" />
              <span className="font-mono">Auto-replies with optional WhatsApp approvals</span>
            </div>
            <div className="flex gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#1D9BF0]" />
              <span className="font-mono">Scheduled posts and engagement tracking</span>
            </div>
            <div className="flex gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#1D9BF0]" />
              <span className="font-mono">Multiple brand voices and projects</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          By logging in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      <div className="flex items-center justify-center p-4 lg:p-10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <Twitter className="h-10 w-10 text-[#1D9BF0]" />
                <span className="font-mono text-2xl font-bold">Replic</span>
              </Link>
            </div>
            <CardTitle className="font-mono text-2xl">Welcome back</CardTitle>
            <CardDescription className="font-mono">Log in to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-mono"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
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

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="font-mono">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#1D9BF0] hover:underline font-mono"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
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
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm font-mono text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[#1D9BF0] hover:underline">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t lg:hidden">
              <p className="text-xs text-center text-muted-foreground font-mono">
                By logging in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

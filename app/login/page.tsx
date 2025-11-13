"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in and redirect to dashboard
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkAuth = async () => {
      try {
        // First, quickly check if cookie exists (fast check)
        const hasCookie = document.cookie.includes('sb-access-token=');
        if (hasCookie) {
          console.log("✅ Auth cookie found, redirecting to dashboard...");
          // Use window.location for full page reload to ensure middleware runs
          window.location.href = "/dashboard";
          return;
        }

        // If no cookie, check Supabase session (might be in localStorage)
        const supabase = getSupabaseBrowserClient();
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn("⚠️ Auth check timeout - proceeding to login form");
            setIsCheckingAuth(false);
          }
        }, 2000); // 2 second timeout

        // Try to get session
        const { data: { session }, error } = await supabase.auth.getSession();

        // Clear timeout since we got a response
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (!isMounted) return;

        if (error) {
          console.error("❌ Error getting session:", error);
          setIsCheckingAuth(false);
          return;
        }

        if (session) {
          console.log("✅ Session found, redirecting to dashboard...");
          // Use window.location for full page reload to ensure middleware runs
          window.location.href = "/dashboard";
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
      } finally {
        // Clear timeout if it's still pending
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

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
        console.log("✅ Login successful, setting cookie and redirecting...");
        // Set cookie manually to ensure middleware can read it (MUST match middleware cookie name)
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;

        // Small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log("🔄 Redirecting to dashboard...");
        // Redirect using window.location for a full page reload
        window.location.href = "/dashboard";
      } else {
        console.error("❌ No session returned after login");
        setError("Login failed - no session created");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D9BF0] mx-auto mb-4"></div>
          <p className="text-sm text-neutral-600 font-mono">Checking authentication...</p>
        </div>
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
          <CardTitle className="font-mono text-2xl">Welcome back</CardTitle>
          <CardDescription className="font-mono">
            Log in to manage your brand automations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-mono">
                {error}
              </div>
            )}

            {/* Email */}
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
                className="font-mono"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="font-mono">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs text-[#1D9BF0] hover:underline font-mono">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="font-mono"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-mono text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#1D9BF0] hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-center text-muted-foreground font-mono">
              By logging in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

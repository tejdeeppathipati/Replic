"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear any local session data when landing on login page
  useEffect(() => {
    const clearSession = async () => {
      if (typeof window !== 'undefined') {
        // Clear localStorage remnants
        localStorage.removeItem('replic_onboarded');
        localStorage.removeItem('replic_config');

        // Clear Supabase session (this logs out the user)
        const supabase = createSupabaseClient();
        await supabase.auth.signOut();
      }
    };
    
    clearSession();
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
      const supabase = createSupabaseClient();

      // Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.session) {
        // Successful login - Supabase automatically sets the auth cookies
        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
      console.error("Login error:", err);
    } finally {
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

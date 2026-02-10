"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { syncServerSession } from "@/lib/auth";
import { NEXT_PUBLIC_SUPABASE_HOST } from "@/lib/env-public";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);

    // Validation
    if (!firstName.trim()) {
      setError("First name is required");
      setLoading(false);
      return;
    }

    if (!lastName.trim()) {
      setError("Last name is required");
      setLoading(false);
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

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

    try {
      const supabase = getSupabaseBrowserClient();

      // Sign up with Supabase Auth.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (!data.user) {
        setError("Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      if (data.session) {
        await syncServerSession(
          data.session.access_token,
          data.session.refresh_token,
          data.session.expires_in
        );

        // Create user profile in app_user table with full name and phone
        const userProfile = {
          id: data.user.id,
          email: data.user.email || email,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          full_name: `${firstName} ${lastName}`,
          created_at: new Date().toISOString(),
        };

        const { error: profileError } = await (supabase as any)
          .from("app_user")
          .insert(userProfile);

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        window.location.assign("/dashboard");
        return;
      }

      // If email confirmation is enabled, Supabase returns a user but no session.
      setSuccess("Account created. Check your email to confirm your address, then log in.");
      setLoading(false);
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
        setError(err.message || "Failed to sign up. Please try again.");
      }
      console.error("Signup error:", err);
      setLoading(false);
    }
  };

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
            Set up once. Let Replic handle the engagement.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground font-mono">
            Create an account to manage brand voice, approvals, and automations.
          </p>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          By signing up, you agree to our Terms of Service and Privacy Policy.
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
            <CardTitle className="font-mono text-2xl">Create your account</CardTitle>
            <CardDescription className="font-mono">
              Start automating your social media engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
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
                  {success}{" "}
                  <Link href="/login" className="underline underline-offset-2">
                    Go to login
                  </Link>
                  .
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="font-mono">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="given-name"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-mono">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="family-name"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="font-mono">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="tel"
                  inputMode="tel"
                  className="font-mono"
                />
              </div>

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
                <Label htmlFor="password" className="font-mono">
                  Password
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
                    Creating account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm font-mono text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-[#1D9BF0] hover:underline">
                  Log in
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t lg:hidden">
              <p className="text-xs text-center text-muted-foreground font-mono">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

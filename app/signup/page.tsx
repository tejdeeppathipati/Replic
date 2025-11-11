"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
      const supabase = createSupabaseClient();

      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
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

        // Success! Go to dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please try again.");
      console.error("Signup error:", err);
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
          <CardTitle className="font-mono text-2xl">Create your account</CardTitle>
          <CardDescription className="font-mono">
            Start automating your social media engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-mono">
                {error}
              </div>
            )}

            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-mono">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-mono">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                  className="font-mono"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="font-mono">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={loading}
                className="font-mono"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono">Email</Label>
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

            {/* Password and Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="font-mono"
              />
              <p className="text-xs text-neutral-500 font-mono">At least 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-mono">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="font-mono"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign Up"}
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

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-center text-muted-foreground font-mono">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

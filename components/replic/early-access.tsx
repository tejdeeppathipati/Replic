"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Mail } from "lucide-react";
import { useState } from "react";

export function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Email validation
    if (!email) {
      setError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setEmail("");
      setLoading(false);

      // Reset after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    }, 1000);
  };

  return (
    <section className="py-16 bg-white" id="early-access">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {!submitted ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-mono font-bold text-neutral-900 mb-2">
                  Get Early Access
                </h2>
                <p className="text-neutral-600 font-mono text-sm">
                  Join our waitlist to be first in line
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="your@email.com"
                  className="flex-1 border border-neutral-300 h-11 font-mono text-sm rounded-lg focus:border-neutral-700 focus:ring-0"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 font-mono h-11 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? "Joining..." : "Join"}
                </Button>
              </form>

              {error && (
                <p className="text-red-600 font-mono text-xs text-center">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-xl font-mono font-bold text-neutral-900">
                You're all set!
              </h3>
              <p className="text-neutral-600 font-mono text-sm">
                Check your email for what's next
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

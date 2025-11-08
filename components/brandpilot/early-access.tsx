"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export function EarlyAccess() {
  return (
    <section className="py-24 bg-neutral-50" id="early-access">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="bg-gradient-to-br from-[#1D9BF0] to-[#0F172A] border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-white mb-4">
                Get Early Access
              </h2>
              <p className="text-blue-100 font-mono mb-8">
                Join the waitlist and be among the first to turn your X account into an AI-powered brand manager.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white font-mono"
                />
                <Button className="bg-white text-[#1D9BF0] hover:bg-neutral-100 font-mono">
                  Join Waitlist <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

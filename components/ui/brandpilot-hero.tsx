"use client";

import * as React from "react";
import {
  Twitter,
  ArrowRight,
  Menu,
  Sparkles,
  MessageCircle,
  Zap,
  Shield,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, useAnimation, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const navigationItems = [
  { title: "Features", href: "#features" },
  { title: "How It Works", href: "#how-it-works" },
  { title: "Personalities", href: "#personalities" },
  { title: "Dashboard", href: "/dashboard" },
];

const labels = [
  { icon: MessageCircle, label: "Auto-Reply" },
  { icon: Sparkles, label: "Brand Voice" },
  { icon: Zap, label: "Daily Posts" },
];

const features = [
  {
    icon: Sparkles,
    label: "Persistent Brand Memory",
    description: "Understands your brand voice from FAQs and posts. Learns your style and maintains consistency across all interactions.",
  },
  {
    icon: MessageCircle,
    label: "Auto-Reply in Style",
    description: "Smart, short, context-aware replies that sound human. Engages with mentions and relevant conversations automatically.",
  },
  {
    icon: Zap,
    label: "Daily Posts",
    description: "Keeps your account alive with content and memes. Scheduled posts that match your brand personality and timing.",
  },
  {
    icon: Shield,
    label: "Safe Guardrails",
    description: "Skips risky or irrelevant tweets automatically. Built-in safety filters to protect your brand reputation.",
  },
];

export function BrandPilotHero() {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  React.useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const titleWords = [
    "TURN",
    "YOUR",
    "X",
    "ACCOUNT",
    "INTO",
    "AN",
    "AI-POWERED",
    "BRAND",
    "MANAGER",
  ];

  return (
    <div className="container mx-auto px-4 min-h-screen bg-background">
      <header>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Twitter className="h-8 w-8 text-[#1D9BF0]" />
              <span className="font-mono text-xl font-bold">BrandPilot</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="text-sm font-mono text-foreground hover:text-[#1D9BF0] transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="default"
              className="rounded-md hidden md:inline-flex bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono"
              asChild
            >
              <Link href="#early-access">
                Get Early Access <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col gap-6 mt-6">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="text-sm font-mono text-foreground hover:text-[#1D9BF0] transition-colors"
                    >
                      {item.title}
                    </Link>
                  ))}
                  <Button className="cursor-pointer rounded-md bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono" asChild>
                    <Link href="#early-access">
                      Get Early Access <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
        <section className="container py-24">
          <div className="flex flex-col items-center text-center">
            <motion.h1
              initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative font-mono text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl max-w-5xl mx-auto leading-tight"
            >
              {titleWords.map((text, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.6
                  }}
                  className="inline-block mx-1 md:mx-2"
                >
                  {text}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mx-auto mt-8 max-w-2xl text-xl text-foreground font-mono"
            >
              BrandPilot replies, posts, and engages on X in your chosen brand voice — so you look active 24/7.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="mt-12 flex flex-wrap justify-center gap-6"
            >
              {labels.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 1.6 + (index * 0.15),
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10
                  }}
                  className="flex items-center gap-2 px-6"
                >
                  <feature.icon className="h-5 w-5 text-[#1D9BF0]" />
                  <span className="text-sm font-mono">{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 2.2,
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10
              }}
              className="flex gap-4 mt-12"
            >
              <Button
                size="lg"
                className="cursor-pointer rounded-md bg-[#1D9BF0] hover:bg-[#1a8cd8] font-mono"
                asChild
              >
                <Link href="#early-access">
                  Get Early Access <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="cursor-pointer rounded-md font-mono"
                asChild
              >
                <Link href="#demo">
                  Watch Demo
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <section className="container pb-24" ref={ref} id="features">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 2.6,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 10
            }}
            className="text-center text-4xl font-mono font-bold mb-6"
          >
            Built for Autonomy, Powered by AI
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8, duration: 0.6 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 2.8 + (index * 0.15),
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                  damping: 10
                }}
                className="flex flex-col items-start text-left p-6 bg-background border rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="mb-4 rounded-full bg-[#1D9BF0]/10 p-3">
                  <feature.icon className="h-6 w-6 text-[#1D9BF0]" />
                </div>
                <h3 className="mb-3 text-lg font-mono font-bold">
                  {feature.label}
                </h3>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>
    </div>
  );
}

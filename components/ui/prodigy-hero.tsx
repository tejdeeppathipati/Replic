"use client";

import * as React from "react";
import {
  Brain,
  ArrowRight,
  Calendar,
  Menu,
  MessageSquare,
  Zap,
  Users,
  Clock,
  FileText,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, useAnimation, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const navigationItems = [
  { title: "Features", href: "#features" },
  { title: "Integrations", href: "#integrations" },
  { title: "How It Works", href: "#how-it-works" },
  { title: "Dashboard", href: "/dashboard" },
];

const labels = [
  { icon: MessageSquare, label: "Auto-Join Meetings" },
  { icon: Brain, label: "Client Memory" },
  { icon: FileText, label: "Smart Documentation" },
];

const features = [
  {
    icon: Users,
    label: "Persistent Client Memory",
    description: "Build a comprehensive understanding of every client conversation, decision, and requirement across all meetings.",
  },
  {
    icon: Clock,
    label: "Story Evolution Timeline",
    description: "Track how user stories develop from initial discussions to validated requirements with complete context.",
  },
  {
    icon: Zap,
    label: "Multi-Agent AI Automation",
    description: "Powered by Dedalus MCP, our AI agents automatically generate Jira tickets and post updates to Slack channels.",
  },
];

export function ProdigyHero() {
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
    "MEETINGS",
    "INTO",
    "MOMENTUM",
  ];

  return (
    <div className="container mx-auto px-4 min-h-screen bg-background">
      <header>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span className="font-mono text-xl font-bold">ProdigyPM</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="text-sm font-mono text-foreground hover:text-indigo-600 transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="default"
              className="rounded-md hidden md:inline-flex bg-indigo-600 hover:bg-indigo-700 font-mono"
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
                      className="text-sm font-mono text-foreground hover:text-indigo-600 transition-colors"
                    >
                      {item.title}
                    </Link>
                  ))}
                  <Button className="cursor-pointer rounded-md bg-indigo-600 hover:bg-indigo-700 font-mono" asChild>
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
              className="relative font-mono text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto leading-tight"
            >
              {titleWords.map((text, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.15,
                    duration: 0.6
                  }}
                  className="inline-block mx-2 md:mx-4"
                >
                  {text}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mx-auto mt-8 max-w-2xl text-xl text-foreground font-mono"
            >
              An AI Product Management Copilot that joins your meetings, remembers client discussions, and transforms them into Jira stories and Slack updates.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mt-12 flex flex-wrap justify-center gap-6"
            >
              {labels.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 1.2 + (index * 0.15),
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10
                  }}
                  className="flex items-center gap-2 px-6"
                >
                  <feature.icon className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-mono">{feature.label}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 1.8,
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 10
              }}
            >
              <Button
                size="lg"
                className="cursor-pointer rounded-md mt-12 bg-indigo-600 hover:bg-indigo-700 font-mono"
                asChild
              >
                <Link href="#early-access">
                  Get Early Access <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <section className="container" ref={ref} id="features">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 2.2,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 10
            }}
            className="text-center text-4xl font-mono font-bold mb-6"
          >
            Powered by AI, Built for Product Teams
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, duration: 0.6 }}
            className="grid md:grid-cols-3 max-w-6xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 2.4 + (index * 0.2),
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                  damping: 10
                }}
                className="flex flex-col items-center text-center p-8 bg-background border rounded-lg"
              >
                <div className="mb-6 rounded-full bg-indigo-600/10 p-4">
                  <feature.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="mb-4 text-xl font-mono font-bold">
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

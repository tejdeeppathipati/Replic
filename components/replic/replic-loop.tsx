"use client";

import { motion } from "framer-motion";
import { Globe, Bot, Send, MessageSquare, Check, Database } from "lucide-react";

const steps = [
  {
    icon: Globe,
    title: "Connect Accounts",
    description: "Link X, Reddit, and WhatsApp",
  },
  {
    icon: Database,
    title: "Scrape Brand Website",
    description: "AI learns your brand voice",
  },
  {
    icon: Bot,
    title: "Generate Drafts",
    description: "Create context-aware replies",
  },
  {
    icon: MessageSquare,
    title: "Send to WhatsApp",
    description: "Review before posting",
  },
  {
    icon: Check,
    title: "Approve/Edit/Skip",
    description: "You have full control",
  },
  {
    icon: Send,
    title: "Post & Log",
    description: "Auto-post and track activity",
  },
];

export function ReplicLoop() {
  return (
    <section className="py-24" id="how-it-works">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-4xl font-mono font-bold mb-4"
        >
          The Replic Loop
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center text-muted-foreground font-mono mb-16"
        >
          From connection to posting — fully automated with optional human oversight
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center p-6 bg-white border rounded-lg hover:shadow-lg transition-shadow">
                <div className="mb-4 rounded-full bg-[#1D9BF0]/10 p-4 relative">
                  <step.icon className="h-8 w-8 text-[#1D9BF0]" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center font-mono font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-lg font-mono font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-[#1D9BF0]/30" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { Twitter, Sparkles, Zap } from "lucide-react";

const steps = [
  {
    icon: Twitter,
    title: "Connect Your X Account",
    description: "Quick OAuth integration to link your brand's X account securely.",
  },
  {
    icon: Sparkles,
    title: "Choose Your Brand Tone",
    description: "Select from Normal, Smart, Unhinged, or Technical personalities.",
  },
  {
    icon: Zap,
    title: "Let AI Engage Automatically",
    description: "BrandPilot replies to mentions, joins conversations, and posts daily content.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-neutral-50" id="how-it-works">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-4xl font-mono font-bold mb-16"
        >
          How It Works
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 rounded-full bg-[#1D9BF0]/10 p-6 relative">
                <step.icon className="h-10 w-10 text-[#1D9BF0]" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center font-mono font-bold">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-mono font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

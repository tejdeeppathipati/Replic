"use client";

import { motion } from "framer-motion";
import { Calendar, Brain, Zap } from "lucide-react";

const steps = [
  {
    icon: Calendar,
    title: "Create Your Meeting",
    description: "Schedule your meeting using Zoom or Google Meet as usual.",
  },
  {
    icon: Brain,
    title: "AI Joins & Listens",
    description: "ProdigyPM automatically joins, transcribes, and summarizes the discussion.",
  },
  {
    icon: Zap,
    title: "Stories Auto-Generated",
    description: "Watch validated user stories and Jira tickets appear automatically in your workspace.",
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
              <div className="mb-6 rounded-full bg-indigo-600/10 p-6 relative">
                <step.icon className="h-10 w-10 text-indigo-600" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono font-bold">
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

"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "ProdigyPM has transformed how we capture requirements. No more lost context between meetings.",
    author: "Sarah Chen",
    role: "Senior Product Manager",
    company: "TechFlow",
  },
  {
    quote: "The AI-generated Jira stories are surprisingly accurate. It saves our team hours every week.",
    author: "Michael Rodriguez",
    role: "Engineering Lead",
    company: "DataSync",
  },
  {
    quote: "Finally, a tool that actually remembers what clients said three meetings ago. Game changer.",
    author: "Emily Watson",
    role: "Head of Product",
    company: "CloudScale",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-neutral-50">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-4xl font-mono font-bold mb-16"
        >
          Trusted by Product Teams
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-indigo-600 mb-4" />
                  <p className="text-sm font-mono leading-relaxed mb-6">
                    {testimonial.quote}
                  </p>
                  <div className="border-t pt-4">
                    <p className="font-mono font-bold text-sm">{testimonial.author}</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {testimonial.role}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {testimonial.company}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

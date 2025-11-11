"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const personalities = [
  {
    name: "Normal",
    description: "Friendly and professional",
    badge: "Balanced",
    color: "bg-blue-500",
    example: "Thanks for reaching out! We'd love to help you with that.",
  },
  {
    name: "Smart",
    description: "Insightful and analytical",
    badge: "Professional",
    color: "bg-purple-500",
    example: "Interesting perspective. Here's how we approach that challenge from a data-driven angle.",
  },
  {
    name: "Unhinged",
    description: "Witty and edgy",
    badge: "Bold",
    color: "bg-orange-500",
    example: "lmao not this again. anyway here's why you're actually wrong 🔥",
  },
  {
    name: "Technical",
    description: "Precise and detailed",
    badge: "Expert",
    color: "bg-green-500",
    example: "Re: your query - we've implemented a multi-layer architecture with async processing. DM for specs.",
  },
];

export function Personalities() {
  return (
    <section className="py-24" id="personalities">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-4xl font-mono font-bold mb-4"
        >
          Pick Your Personality
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center text-muted-foreground font-mono mb-12"
        >
          Choose the tone that matches your brand voice
        </motion.p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {personalities.map((persona, index) => (
            <motion.div
              key={persona.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-3 h-3 rounded-full ${persona.color}`} />
                    <Badge variant="outline" className="font-mono text-xs">
                      {persona.badge}
                    </Badge>
                  </div>
                  <CardTitle className="font-mono text-xl">{persona.name}</CardTitle>
                  <CardDescription className="font-mono">
                    {persona.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-neutral-50 p-4 rounded-lg border-l-4 border-[#1D9BF0]">
                    <p className="font-mono text-sm italic">
                      {persona.example}
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

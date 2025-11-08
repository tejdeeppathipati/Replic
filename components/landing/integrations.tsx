"use client";

import { motion } from "framer-motion";
import { Video, MessageSquare, ListTodo, Mic, Slack } from "lucide-react";
import { Card } from "@/components/ui/card";

const integrations = [
  { name: "Zoom", icon: Video, color: "text-blue-600" },
  { name: "Google Meet", icon: Video, color: "text-green-600" },
  { name: "Jira", icon: ListTodo, color: "text-blue-500" },
  { name: "Slack", icon: Slack, color: "text-purple-600" },
  { name: "ElevenLabs", icon: Mic, color: "text-orange-600" },
  { name: "Dedalus Labs", icon: MessageSquare, color: "text-indigo-600" },
];

export function Integrations() {
  return (
    <section className="py-24" id="integrations">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-4xl font-mono font-bold mb-4"
        >
          Connect Your Tools in Minutes
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center text-muted-foreground font-mono mb-12"
        >
          Seamlessly integrates with the tools you already use
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card className="p-6 flex flex-col items-center justify-center h-32 hover:shadow-lg transition-shadow">
                <integration.icon className={`h-10 w-10 mb-3 ${integration.color}`} />
                <p className="text-xs font-mono font-semibold text-center">
                  {integration.name}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

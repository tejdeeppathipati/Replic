"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/card";

const integrations = [
  { name: "X", icon: "/icons/twitter.png" },
  { name: "Reddit", icon: "/icons/reddit.png" },
  { name: "WhatsApp", icon: "/icons/whatsapp.png" },
  { name: "iMessage", icon: "/icons/messages.png" },
];

export function Integrations() {
  return (
    <section className="py-24 bg-neutral-50" id="integrations">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-4xl font-mono font-bold mb-4"
        >
          Multi-Platform Publishing
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center text-muted-foreground font-mono mb-12"
        >
          Manage multiple projects with integrated platform connectors
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card className="p-6 flex flex-col items-center justify-center h-32 hover:shadow-lg transition-shadow">
                <Image
                  src={integration.icon}
                  alt={integration.name}
                  width={50}
                  height={50}
                  className="mb-3 object-contain"
                />
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

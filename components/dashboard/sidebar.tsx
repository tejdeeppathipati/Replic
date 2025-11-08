"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Home, Calendar, Users, FileText, Plug, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Meetings", href: "/dashboard/meetings" },
  { icon: Users, label: "Clients", href: "/dashboard/clients" },
  { icon: FileText, label: "Stories", href: "/dashboard/stories" },
  { icon: Plug, label: "Integrations", href: "/dashboard/integrations" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-neutral-900 text-white min-h-screen p-6 flex flex-col">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Brain className="h-8 w-8 text-indigo-400" />
        <span className="font-mono text-xl font-bold">ProdigyPM</span>
      </Link>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm transition-colors",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

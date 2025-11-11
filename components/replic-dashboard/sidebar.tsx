"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Twitter, Home, Activity, Send, Settings, Plug, HelpCircle, LogOut, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Activity, label: "Activity Feed", href: "/dashboard/activity" },
  { icon: Target, label: "Actions", href: "/dashboard/actions" },
  { icon: Send, label: "Posts", href: "/dashboard/posts" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: Plug, label: "Integrations", href: "/dashboard/integrations" },
];

const bottomItems = [
  { icon: HelpCircle, label: "Help", href: "/help" },
  { icon: LogOut, label: "Logout", href: "/" },
];

export function ReplicSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-[#0F172A] text-white min-h-screen p-6 flex flex-col">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Twitter className="h-8 w-8 text-[#1D9BF0]" />
        <span className="font-mono text-xl font-bold">Replic</span>
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
                  ? "bg-[#1D9BF0] text-white"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-neutral-800 pt-4">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

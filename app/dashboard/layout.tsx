"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Home, Send, Settings, Plug, LogOut, Twitter, Activity, Target, MessageSquare } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProjectSelector } from "@/components/ui/project-selector";
import { UserProfileButton } from "@/components/ui/user-profile";
import { useRouter } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [open, setOpen] = useState(false);

  // Validate session on mount and when coming back to the page
  useEffect(() => {
    const validateSession = async () => {
      try {
        const session = await getCurrentSession();
        if (!session) {
          console.log('No valid session, redirecting to login');
          router.push('/login');
          return;
        }
        setIsValidating(false);
      } catch (error) {
        console.error('Session validation error:', error);
        router.push('/login');
      }
    };

    validateSession();

    // Also validate when window regains focus (user comes back)
    const handleFocus = () => {
      validateSession();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [router]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1D9BF0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-neutral-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <Home className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Projects",
      href: "/dashboard/projects",
      icon: (
        <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Activity Feed",
      href: "/dashboard/activity",
      icon: (
        <Activity className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Actions",
      href: "/dashboard/actions",
      icon: (
        <Target className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Auto-Replies",
      href: "/dashboard/auto-replies",
      icon: (
        <MessageSquare className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Posts",
      href: "/dashboard/posts",
      icon: (
        <Send className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Integrations",
      href: "/dashboard/integrations",
      icon: (
        <Plug className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "/",
      icon: (
        <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 flex-col">
        <div className="p-4 md:p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-mono text-sm text-neutral-600">Project:</h2>
            <ProjectSelector />
          </div>
          {/* User Profile Button */}
          <UserProfileButton />
        </div>
        <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20 hover:opacity-80 transition-opacity"
    >
      <Twitter className="h-6 w-6 text-[#1D9BF0] flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-mono font-bold text-lg text-black dark:text-white whitespace-pre"
      >
        Replic
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20 hover:opacity-80 transition-opacity"
    >
      <Twitter className="h-6 w-6 text-[#1D9BF0] flex-shrink-0" />
    </Link>
  );
};

"use client";

import { Twitter, Github, Linkedin } from "lucide-react";
import Link from "next/link";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Personalities", href: "#personalities" },
      { label: "Pricing", href: "#pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#docs" },
      { label: "Blog", href: "#blog" },
      { label: "API", href: "#api" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-neutral-300 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Twitter className="h-8 w-8 text-[#1D9BF0]" />
              <span className="font-mono text-xl font-bold text-white">BrandPilot</span>
            </div>
            <p className="text-sm font-mono text-neutral-400 mb-6">
              AI Agent for X that auto-replies in your brand voice.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-[#1D9BF0] transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-[#1D9BF0] transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-[#1D9BF0] transition-colors">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-mono font-bold text-white mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-mono hover:text-[#1D9BF0] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-800 pt-8 text-center">
          <p className="text-sm font-mono text-neutral-500">
            2025 BrandPilot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

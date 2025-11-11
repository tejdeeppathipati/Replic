'use client';

import React from 'react';
import Link from 'next/link';
import { Twitter } from 'lucide-react';

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }

    if (menuOpen) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <section className="bg-gradient-to-b from-neutral-50 to-white w-full text-sm pb-44">
        <nav className="flex items-center justify-between p-4 md:px-16 lg:px-24 xl:px-32 md:py-6 w-full">
          <Link href="/" aria-label="Replic home" className="flex items-center gap-2">
            <Twitter className="h-8 w-8 text-[#1D9BF0]" />
            <span className="font-mono text-xl font-bold">Replic</span>
          </Link>

          <div
            id="menu"
            ref={menuRef}
            className={[
              'max-md:absolute max-md:top-0 max-md:left-0 max-md:transition-all max-md:duration-300 max-md:overflow-hidden max-md:h-full max-md:bg-white/50 max-md:backdrop-blur',
              'flex items-center gap-8 font-medium font-mono',
              'max-md:flex-col max-md:justify-center',
              menuOpen ? 'max-md:w-full' : 'max-md:w-0',
            ].join(' ')}
            aria-hidden={!menuOpen}
          >
            <Link href="#features" className="hover:text-[#1D9BF0]">Features</Link>
            <Link href="#how-it-works" className="hover:text-[#1D9BF0]">How It Works</Link>
            <Link href="#personalities" className="hover:text-[#1D9BF0]">Personalities</Link>
            <Link href="/dashboard" className="hover:text-[#1D9BF0]">Dashboard</Link>

            <button
              onClick={() => setMenuOpen(false)}
              className="md:hidden bg-gray-800 hover:bg-black text-white p-2 rounded-md aspect-square font-medium transition"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <Link href="/signup" className="hidden md:block bg-[#1D9BF0] hover:bg-[#1a8cd8] text-white px-6 py-3 rounded-full font-medium font-mono transition">
            Get Started
          </Link>

          <button
            id="open-menu"
            onClick={() => setMenuOpen(true)}
            className="md:hidden bg-gray-800 hover:bg-black text-white p-2 rounded-md aspect-square font-medium transition"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 12h16" />
              <path d="M4 18h16" />
              <path d="M4 6h16" />
            </svg>
          </button>
        </nav>

        <div className="flex items-center gap-2 border border-slate-300 hover:border-[#1D9BF0]/50 rounded-full w-max mx-auto px-4 py-2 mt-40 md:mt-32 transition-colors">
          <span className="font-mono text-sm">AI Agent for X, Reddit, and WhatsApp</span>
          <button className="flex items-center gap-1 font-medium font-mono text-[#1D9BF0]">
            <span>Learn more</span>
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3.959 9.5h11.083m0 0L9.501 3.958M15.042 9.5l-5.541 5.54" stroke="#1D9BF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <h1 className="text-4xl md:text-7xl font-bold max-w-[950px] text-center mx-auto mt-8 font-mono leading-tight">
          Turn Your X and Reddit Accounts Into an AI-Powered Brand Manager
        </h1>

        <p className="text-sm md:text-base mx-auto max-w-2xl text-center mt-6 max-md:px-2 font-mono text-muted-foreground">
          Replic watches, replies, and posts in your voice — with optional WhatsApp approvals. Never miss an engagement opportunity.
        </p>

        <div className="mx-auto w-full flex items-center justify-center gap-3 mt-8">
          <Link href="/signup" className="bg-[#1D9BF0] hover:bg-[#1a8cd8] text-white px-6 py-3 rounded-full font-medium font-mono transition">
            Get Started
          </Link>
          <Link href="#how-it-works" className="flex items-center gap-2 border border-slate-300 hover:bg-slate-100 rounded-full px-6 py-3 font-mono transition">
            <span>See How It Works</span>
            <svg width="6" height="8" viewBox="0 0 6 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M1.25.5 4.75 4l-3.5 3.5" stroke="#050040" strokeOpacity=".4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}

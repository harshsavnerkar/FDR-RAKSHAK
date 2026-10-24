import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export function Navbar({ onStartFree, onWatchDemo }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Product', href: '#product' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: '#docs' },
  ];

  return (
    <header className="relative z-30 pt-6 px-4 sm:px-8 max-w-[1440px] mx-auto">
      <nav className="flex items-center justify-between">
        
        {/* Left: Logo Tile + Wordmark */}
        <a href="#" className="flex items-center gap-3 group">
          {/* Mustard Rounded Square Logo Tile */}
          <div className="w-[42px] h-[42px] rounded-[12px] bg-memphis-mustard border-3 border-ink shadow-hard-md flex items-center justify-center transition-transform group-hover:scale-105">
            {/* Black Squiggle Glyph */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M 4 12 Q 8 6, 12 12 T 20 12"
                stroke="#17140d"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          <span className="font-display font-extrabold text-[26px] tracking-tight text-ink">
            Loopa
          </span>
        </a>

        {/* Center: 4 Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-sans font-medium text-[15px] text-ink hover:text-memphis-coral transition-colors tracking-normal"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: Teal 'Start free' Pill CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={onStartFree}
            className="memphis-btn-teal px-6 py-2.5 rounded-full font-sans font-bold text-[15px] tracking-wide cursor-pointer select-none"
          >
            Start free
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-xl bg-cream border-3 border-ink shadow-hard-sm flex items-center justify-center text-ink cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 p-5 bg-white border-3 border-ink shadow-hard-lg rounded-2xl animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-display font-bold text-lg text-ink hover:text-memphis-coral transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t-2 border-ink/20 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onStartFree();
                }}
                className="memphis-btn-teal w-full py-3 rounded-full font-bold text-center"
              >
                Start free
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onWatchDemo();
                }}
                className="memphis-btn-white w-full py-3 rounded-full font-bold text-center"
              >
                Watch the demo
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

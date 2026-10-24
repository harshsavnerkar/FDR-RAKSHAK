import React from 'react';
import { ArrowRight, Play, Star, ShieldCheck } from 'lucide-react';
import { DashboardMockup } from './DashboardMockup';
import { MemphisConfetti } from './MemphisConfetti';

export function HeroSection({ onStartFree, onWatchDemo }) {
  const avatars = [
    { initial: 'K', bg: 'bg-memphis-coral', text: 'text-white' },
    { initial: 'M', bg: 'bg-memphis-teal', text: 'text-white' },
    { initial: 'R', bg: 'bg-memphis-violet', text: 'text-white' },
    { initial: 'S', bg: 'bg-memphis-mustard', text: 'text-ink' },
  ];

  return (
    <section className="relative pt-10 sm:pt-16 pb-20 sm:pb-28 px-4 sm:px-8 max-w-[1440px] mx-auto overflow-hidden">
      
      {/* Animated Memphis Confetti in the Background */}
      <MemphisConfetti />

      {/* 2-Column Asymmetric Grid (~1.05fr copy / 0.95fr product card) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left Column: Copy, Headline with Markers, Dual CTA, Trust */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-6 sm:space-y-8">
          
          {/* Violet Eyebrow Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-memphis-violet text-white border-3 border-ink shadow-hard-md select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-memphis-mustard border border-ink" />
            <span className="font-display font-extrabold text-xs sm:text-sm tracking-wider uppercase">
              NEW - Team plans just dropped
            </span>
          </div>

          {/* Huge Bricolage Grotesque 800 Headline with Marker-Highlights */}
          <h1 className="font-display font-extrabold text-[46px] sm:text-[62px] lg:text-[76px] leading-[0.98] tracking-tight text-ink">
            Ship work that{' '}
            <span className="marker-highlight-mustard text-ink">
              actually
            </span>{' '}
            gets{' '}
            <span className="marker-highlight-teal text-ink">
              done.
            </span>
          </h1>

          {/* Lead Paragraph (~19px) */}
          <p className="font-sans text-base sm:text-[19px] text-ink-muted leading-relaxed max-w-xl">
            Loopa replaces clunky roadmaps and soul-sucking spreadsheets with a fast, tactile workspace where cross-functional squads plan weekly sprints, kill bottlenecks, and celebrate momentum.
          </p>

          {/* Dual CTA Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
            {/* Primary Coral Pill */}
            <button
              onClick={onStartFree}
              className="memphis-btn-coral px-8 py-4 rounded-full font-display font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <span>Start free</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>

            {/* Secondary White Ghost Pill */}
            <button
              onClick={onWatchDemo}
              className="memphis-btn-white px-8 py-4 rounded-full font-display font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-6 h-6 rounded-full bg-memphis-mustard border-2 border-ink flex items-center justify-center">
                <Play className="w-3 h-3 fill-ink text-ink ml-0.5" />
              </div>
              <span>Watch the demo</span>
            </button>
          </div>

          {/* Trust Row: 4 Overlapping Avatars + 2-Line Proof */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Overlapping Avatars */}
            <div className="flex items-center -space-x-3">
              {avatars.map((av, idx) => (
                <div
                  key={idx}
                  className={`w-11 h-11 rounded-full ${av.bg} ${av.text} border-3 border-ink flex items-center justify-center font-display font-extrabold text-sm shadow-[2px_2px_0_#17140d] transition-transform hover:-translate-y-1`}
                >
                  {av.initial}
                </div>
              ))}
            </div>

            {/* Proof Text */}
            <div className="text-xs sm:text-[13px] font-sans leading-snug">
              <div className="font-bold text-ink">
                12,000+ teams plan their week in Loopa.
              </div>
              <div className="text-ink-muted">
                No credit card, no meetings about meetings.
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Tilted Product Dashboard Mockup */}
        <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
          <DashboardMockup />
        </div>

      </div>

    </section>
  );
}

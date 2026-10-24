import React from 'react';
import { ArrowUpRight, Heart } from 'lucide-react';

export function Footer({ onStartFree }) {
  return (
    <footer className="w-full bg-[#eee5d3] border-t-3 border-ink pt-16 pb-12 px-4 sm:px-8 select-none">
      <div className="max-w-[1440px] mx-auto">
        
        {/* Top Callout Box in Footer */}
        <div className="memphis-card p-8 sm:p-12 mb-16 bg-memphis-mustard flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white border-2 border-ink font-display font-extrabold text-xs text-ink uppercase mb-3 shadow-hard-sm">
              Ready to ship faster?
            </span>
            <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-ink tracking-tight">
              Get your squad into Loopa today.
            </h3>
            <p className="font-sans text-sm sm:text-base text-ink-muted mt-2">
              Join over 12,000 teams who ditched boring Jira tickets for momentum.
            </p>
          </div>

          <button
            onClick={onStartFree}
            className="memphis-btn-coral px-8 py-4 rounded-full font-display font-extrabold text-base whitespace-nowrap cursor-pointer"
          >
            Start free now &rarr;
          </button>
        </div>

        {/* Footer Links & Credits */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t-2 border-ink/20 text-xs font-sans text-ink-muted">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-memphis-mustard border-2 border-ink flex items-center justify-center">
              <span className="font-display font-black text-xs text-ink">L</span>
            </div>
            <span className="font-display font-bold text-sm text-ink">Loopa Inc.</span>
            <span>&copy; 2026. Made loud for creative teams everywhere.</span>
          </div>

          <div className="flex items-center gap-6 font-bold text-ink">
            <a href="#privacy" className="hover:text-memphis-coral transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-memphis-coral transition-colors">Terms</a>
            <a href="#security" className="hover:text-memphis-coral transition-colors">Security</a>
            <a href="#status" className="hover:text-memphis-coral transition-colors flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-memphis-teal inline-block" />
              <span>All Systems Go</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}

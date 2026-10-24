import React, { useState } from 'react';
import { X, Play, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export function DemoModal({ isOpen, onClose }) {
  const [isPlaying, setIsPlaying] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white border-3 border-ink shadow-hard-xl rounded-[26px] p-6 sm:p-8 z-10 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b-3 border-ink">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-memphis-mustard border-2 border-ink flex items-center justify-center">
              <Play className="w-4 h-4 fill-ink text-ink ml-0.5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xl text-ink">
                Loopa in 90 Seconds
              </h3>
              <p className="text-xs font-sans text-ink-muted">
                See how modern product squads plan, track, and ship
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-cream border-2 border-ink shadow-hard-sm flex items-center justify-center hover:bg-memphis-coral hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Video Simulation Canvas */}
        <div className="relative aspect-video rounded-2xl bg-cream border-3 border-ink overflow-hidden shadow-[inset_2px_2px_0_#17140d] flex flex-col justify-between p-6">
          
          {/* Top simulated HUD */}
          <div className="flex items-center justify-between">
            <div className="bg-white border-2 border-ink rounded-lg px-3 py-1 font-display font-bold text-xs shadow-hard-sm">
              LIVE MULTIPLAYER DEMO
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-memphis-teal animate-ping" />
              <span className="font-display font-extrabold text-xs text-ink">
                4 Active Squad Members
              </span>
            </div>
          </div>

          {/* Central Interactive Content */}
          <div className="text-center space-y-3 my-auto">
            <div className="inline-block p-4 rounded-full bg-memphis-coral text-white border-3 border-ink shadow-hard-md animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <h4 className="font-display font-extrabold text-2xl text-ink">
              Speed run your next product release
            </h4>
            <p className="text-xs sm:text-sm font-sans text-ink-muted max-w-md mx-auto">
              Realtime backlog grooming, velocity telemetry, and zero lag. Try checking items on the hero mockup card!
            </p>
          </div>

          {/* Bottom Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 rounded-full bg-white border-2 border-ink overflow-hidden">
              <div className="h-full bg-memphis-teal w-2/3 border-r-2 border-ink transition-all duration-300" />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-ink-muted font-sans">
              <span>0:42 / 1:30</span>
              <span>1080p 60fps</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-ink-muted">
            Used by fast-moving teams across tech and design
          </div>
          <button
            onClick={onClose}
            className="memphis-btn-coral px-6 py-2.5 rounded-full font-display font-bold text-sm"
          >
            Got it, take me back
          </button>
        </div>

      </div>
    </div>
  );
}

export function SignupModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white border-3 border-ink shadow-hard-xl rounded-[26px] p-6 sm:p-8 z-10 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b-3 border-ink">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-memphis-coral border-2 border-ink" />
            <h3 className="font-display font-extrabold text-2xl text-ink">
              Start Free on Loopa
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-cream border-2 border-ink shadow-hard-sm flex items-center justify-center hover:bg-memphis-coral hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-memphis-teal text-white border-3 border-ink shadow-hard-md flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h4 className="font-display font-extrabold text-2xl text-ink">
              Welcome to the Squad!
            </h4>
            <p className="text-sm font-sans text-ink-muted max-w-xs mx-auto">
              We just sent a one-click magic sign-in link to <strong>{email}</strong>. No passwords to remember.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="memphis-btn-coral px-8 py-3 rounded-full font-display font-bold text-sm"
            >
              Open Workspace
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSubmitted(true);
            }}
            className="space-y-4"
          >
            <p className="text-sm font-sans text-ink-muted">
              Get your entire squad onboarded in under 60 seconds. Free forever for up to 10 teammates.
            </p>

            <div>
              <label className="block text-xs font-display font-extrabold uppercase text-ink mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl bg-cream border-3 border-ink text-ink font-sans font-medium text-sm focus:outline-none focus:bg-white shadow-[inset_2px_2px_0_#17140d]"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-extrabold uppercase text-ink mb-1.5">
                Squad Size
              </label>
              <select className="w-full px-4 py-3 rounded-xl bg-cream border-3 border-ink text-ink font-sans font-medium text-sm focus:outline-none focus:bg-white shadow-[inset_2px_2px_0_#17140d]">
                <option>1 - 5 teammates (Seed / Solo)</option>
                <option>6 - 25 teammates (Growth pod)</option>
                <option>26 - 100 teammates (Scale squad)</option>
                <option>100+ teammates (Enterprise)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="memphis-btn-teal w-full py-4 rounded-full font-display font-extrabold text-base flex items-center justify-center gap-2 shadow-hard-md cursor-pointer"
              >
                <span>Create free workspace</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            <div className="text-center text-[11px] font-sans text-ink-subtle">
              Instant activation • No credit card required • SOC-2 certified
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

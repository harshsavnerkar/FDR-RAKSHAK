import React from 'react';
import { Layers, Activity, Users2, Sparkles, Zap, ShieldAlert } from 'lucide-react';

export function FeaturesSection({ onExploreFeature }) {
  const features = [
    {
      id: 'plans',
      title: 'Plans that flow',
      copy: 'Drag, drop, and reshuffle priorities with zero latency. No complex multi-layer nested menus or bureaucratic setup.',
      chipColor: 'bg-memphis-coral',
      accentColor: 'bg-memphis-coral/15',
      icon: Layers,
      stat: '0.4s setup',
    },
    {
      id: 'progress',
      title: 'Progress you can see',
      copy: 'Instant visual velocity bars and completion gauges that turn boring task updates into shared daily squad dopamine.',
      chipColor: 'bg-memphis-teal',
      accentColor: 'bg-memphis-teal/15',
      icon: Activity,
      stat: '+38% velocity',
    },
    {
      id: 'crew',
      title: 'Built for the crew',
      copy: 'Multiplayer presence, realtime state sync, and lightweight checklists so every engineer and designer stays in sync.',
      chipColor: 'bg-memphis-violet',
      accentColor: 'bg-memphis-violet/15',
      icon: Users2,
      stat: '100% realtime',
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-8 max-w-[1440px] mx-auto">
      
      {/* Centered Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        
        {/* Violet Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-memphis-violet text-white border-3 border-ink shadow-hard-md select-none">
          <Sparkles className="w-3.5 h-3.5 text-memphis-mustard" />
          <span className="font-display font-extrabold text-xs sm:text-sm tracking-wider uppercase">
            WHY TEAMS SWITCH
          </span>
        </div>

        {/* Two-Line 46px Bricolage Heading */}
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[46px] leading-[1.08] text-ink tracking-tight">
          Boring tools kill momentum.{' '}
          <span className="text-memphis-coral underline decoration-wavy decoration-3 decoration-ink underline-offset-4">
            Loopa keeps it loud.
          </span>
        </h2>

        <p className="font-sans text-base sm:text-lg text-ink-muted max-w-xl mx-auto">
          Built for teams tired of gray enterprise tickets. Give your squad tools that look alive and work as fast as you think.
        </p>

      </div>

      {/* Three-Up Feature Card Row */}
      <div className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-6 lg:gap-8">
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              className="memphis-card memphis-card-hover p-6 sm:p-8 flex flex-col justify-between overflow-hidden group cursor-pointer"
              onClick={() => onExploreFeature(feat)}
            >
              <div>
                {/* 62px Outlined Icon Chip */}
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-[62px] h-[62px] rounded-2xl ${feat.chipColor} border-3 border-ink shadow-hard-md flex items-center justify-center text-white transition-transform group-hover:scale-105 group-hover:-rotate-3`}
                  >
                    <Icon className="w-7 h-7 stroke-[2.5]" />
                  </div>

                  <span className="font-display font-extrabold text-xs px-3 py-1 rounded-full bg-cream border-2 border-ink shadow-[2px_2px_0_#17140d]">
                    {feat.stat}
                  </span>
                </div>

                {/* Bricolage 700 Title */}
                <h3 className="font-display font-bold text-2xl text-ink tracking-tight mb-3">
                  {feat.title}
                </h3>

                {/* ~15px DM Sans Copy */}
                <p className="font-sans text-[15px] text-ink-muted leading-relaxed">
                  {feat.copy}
                </p>
              </div>

              {/* Bottom Row: Link action */}
              <div className="pt-6 mt-6 border-t-2 border-ink/10 flex items-center justify-between z-10">
                <span className="font-display font-extrabold text-sm text-ink group-hover:text-memphis-coral transition-colors flex items-center gap-1.5">
                  <span>Explore workflow</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-ink" />
              </div>

              {/* Soft Translucent Corner Circle Accent Bleeding Off Bottom-Right */}
              <div
                className={`absolute -bottom-10 -right-10 w-36 h-36 rounded-full ${feat.accentColor} border-3 border-ink/20 pointer-events-none transition-transform group-hover:scale-110`}
              />
            </div>
          );
        })}
      </div>

    </section>
  );
}

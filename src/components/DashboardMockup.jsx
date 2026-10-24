import React, { useState } from 'react';
import { Check, Flame, ArrowUpRight, Sparkles } from 'lucide-react';

export function DashboardMockup() {
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Ship the new onboarding flow', checked: true, tag: 'High priority' },
    { id: 2, text: 'Review Q3 roadmap draft', checked: true, tag: 'Design' },
    { id: 3, text: 'Sync with the growth pod', checked: false, tag: 'Tomorrow' },
  ]);

  const [hoveredBar, setHoveredBar] = useState(null);

  const bars = [
    { day: 'Mon', height: '44%', value: '44 pts', color: 'bg-memphis-mustard' },
    { day: 'Tue', height: '62%', value: '62 pts', color: 'bg-memphis-coral' },
    { day: 'Wed', height: '52%', value: '52 pts', color: 'bg-memphis-violet' },
    { day: 'Thu', height: '82%', value: '82 pts', color: 'bg-memphis-teal' },
    { day: 'Fri', height: '70%', value: '70 pts', color: 'bg-memphis-sky' },
    { day: 'Sat', height: '96%', value: '96 pts', color: 'bg-memphis-coral' },
  ];

  const toggleCheck = (id) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <div className="relative w-full max-w-[530px] mx-auto select-none">
      
      {/* Decorative Playful Floating Pill Badge behind/above */}
      <div className="absolute -top-5 -right-3 z-20 transform rotate-6 animate-bob-slow">
        <div className="bg-memphis-mustard border-3 border-ink shadow-hard-sm px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-ink" />
          <span className="font-display font-extrabold text-xs tracking-wide text-ink uppercase">
            Realtime Sync
          </span>
        </div>
      </div>

      {/* Main Tilted (-2deg) Card */}
      <div className="transform md:-rotate-2 transition-transform duration-300 hover:rotate-0 memphis-card p-0 overflow-hidden bg-white">
        
        {/* Browser-Chrome Top Bar */}
        <div className="bg-[#fcf8f0] border-b-3 border-ink px-4 py-3 flex items-center justify-between">
          {/* Three Outlined Traffic Light Dots */}
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-memphis-coral border-2 border-ink inline-block" />
            <span className="w-3.5 h-3.5 rounded-full bg-memphis-mustard border-2 border-ink inline-block" />
            <span className="w-3.5 h-3.5 rounded-full bg-memphis-teal border-2 border-ink inline-block" />
          </div>

          {/* Sub-bar Title */}
          <div className="bg-cream-light border-2 border-ink rounded-lg px-4 py-1 font-display font-bold text-xs text-ink tracking-tight shadow-[2px_2px_0_#17140d]">
            This week - Design squad
          </div>

          <div className="w-10" />
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Header Row: Title + Velocity Status Pill */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
                Velocity Overview
              </div>
              <h4 className="font-display font-extrabold text-xl sm:text-2xl text-ink tracking-tight">
                Sprint velocity
              </h4>
            </div>

            {/* Teal Status Pill */}
            <div className="bg-memphis-teal text-white border-2 border-ink shadow-hard-sm px-3 py-1 rounded-full font-display font-extrabold text-xs flex items-center gap-1">
              <span>+38% up</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Six-Bar Chart Panel */}
          <div className="bg-[#fffdf7] border-3 border-ink rounded-xl p-4 shadow-[inset_2px_2px_0_#17140d]">
            <div className="h-40 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b-2 border-ink/20">
              {bars.map((bar, index) => (
                <div
                  key={bar.day}
                  className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip on hover */}
                  {hoveredBar === index && (
                    <div className="absolute -top-8 bg-ink text-white font-display font-bold text-[10px] px-2 py-0.5 rounded border border-white whitespace-nowrap shadow-sm z-10 animate-in fade-in">
                      {bar.value}
                    </div>
                  )}

                  {/* Vertical Bar */}
                  <div
                    style={{ height: bar.height }}
                    className={`w-full max-w-[36px] ${bar.color} border-2 border-ink rounded-t-lg transition-all duration-200 group-hover:scale-y-105 origin-bottom`}
                  />
                </div>
              ))}
            </div>

            {/* Days row */}
            <div className="flex items-center justify-between text-center pt-2 px-2 text-[11px] font-bold font-sans text-ink-muted">
              {bars.map((bar) => (
                <div key={bar.day} className="flex-1">
                  {bar.day}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Checklist Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold font-sans text-ink-muted px-1">
              <span>Sprint Deliverables</span>
              <span>{checklist.filter((i) => i.checked).length} of 3 done</span>
            </div>

            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3 rounded-xl border-2 border-ink flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  item.checked
                    ? 'bg-[#f4fbf9] shadow-hard-sm'
                    : 'bg-white hover:bg-[#fff9ea]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox button */}
                  <div
                    className={`w-6 h-6 rounded-lg border-2 border-ink flex items-center justify-center transition-colors ${
                      item.checked
                        ? 'bg-memphis-teal text-white'
                        : 'bg-white'
                    }`}
                  >
                    {item.checked && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>

                  <span
                    className={`text-xs sm:text-[13px] font-medium transition-all ${
                      item.checked
                        ? 'line-through text-ink-subtle'
                        : 'text-ink font-semibold'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cream border border-ink text-ink-muted">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Decorative Bottom Corner Sticker */}
      <div className="absolute -bottom-4 -left-4 z-20 transform -rotate-6 hidden sm:block">
        <div className="bg-memphis-violet text-white border-3 border-ink shadow-hard-sm px-3 py-1.5 rounded-full font-display font-extrabold text-xs tracking-wider">
          FAST AS HECK
        </div>
      </div>

    </div>
  );
}

import React from 'react';
import {
  UserPlus,
  UploadCloud,
  CheckSquare,
  FileKey,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export function QuickActions({ onActionSelect }) {
  const actions = [
    {
      id: "register",
      title: "Register Institution",
      subtitle: "Onboard new college or technical institute PID",
      icon: UserPlus,
      targetNav: "Institutions",
      accent: "text-[#1e90ff]",
      btnStyle: "hover:border-[#1e90ff]/50",
    },
    {
      id: "upload",
      title: "Upload New FDR",
      subtitle: "Intake certificate scan for OCR batch pipeline",
      icon: UploadCloud,
      targetNav: "FDR Repository",
      accent: "text-accent-orange",
      btnStyle: "hover:border-accent-orange/50",
    },
    {
      id: "verify",
      title: "Review Verification Queue",
      subtitle: "Audit AI extraction mismatches and bank seals",
      icon: CheckSquare,
      targetNav: "AI Verification",
      accent: "text-[#ffa502]",
      btnStyle: "hover:border-[#ffa502]/50",
    },
    {
      id: "release",
      title: "View Release Requests",
      subtitle: "Process institutional security deposit discharge",
      icon: FileKey,
      targetNav: "Release Requests",
      accent: "text-[#2ed573]",
      btnStyle: "hover:border-[#2ed573]/50",
    },
  ];

  return (
    <div className="skeuo-panel p-5 relative overflow-hidden">
      {/* Corner Screws */}
      <span className="screw-head absolute top-3 left-3 opacity-80" />
      <span className="screw-head absolute top-3 right-3 opacity-80" />
      <span className="screw-head absolute bottom-3 left-3 opacity-80" />
      <span className="screw-head absolute bottom-3 right-3 opacity-80" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#d1d9e6]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
            ADMINISTRATIVE DESK
          </span>
          <h3 className="text-sm font-bold text-text-primary">
            Quick Command Actions
          </h3>
        </div>
        <div className="flex gap-1">
          <span className="vent-slot h-2.5 w-1" />
          <span className="vent-slot h-2.5 w-1" />
        </div>
      </div>

      {/* Actions Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => onActionSelect(act)}
              className={`skeuo-btn p-3.5 rounded-xl flex flex-col justify-between text-left group transition-all duration-150 relative ${act.btnStyle}`}
            >
              <div className="flex items-start justify-between w-full">
                <div className={`w-9 h-9 rounded-lg skeuo-recessed flex items-center justify-center ${act.accent} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>

              <div className="mt-3">
                <div className="text-xs font-bold text-text-primary group-hover:text-accent-orange transition-colors">
                  {act.title}
                </div>
                <div className="text-[10px] font-mono text-text-muted mt-0.5 leading-snug">
                  {act.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

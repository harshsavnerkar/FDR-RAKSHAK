import React from 'react';

/**
 * StatCard Component
 * Industrial Skeuomorphic card with four corner screws, recessed icon well,
 * high-contrast monospace metrics, and tactile interactions.
 */
export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = "default", // "default", "warning", "pending", "critical"
  onClick,
  isActive = false,
  badgeText,
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "critical":
        return {
          accentBorder: "border-l-4 border-l-[#ff4757]",
          iconBg: "bg-[#ffebee] text-[#d32f2f]",
          badgeColor: "bg-[#ff4757]/15 text-[#c53030] border-[#ff4757]/30",
          glow: "group-hover:border-[#ff4757]/40",
        };
      case "warning":
        return {
          accentBorder: "border-l-4 border-l-[#ff6b35]",
          iconBg: "bg-[#fff3e0] text-[#e65100]",
          badgeColor: "bg-[#ff6b35]/15 text-[#c05621] border-[#ff6b35]/30",
          glow: "group-hover:border-[#ff6b35]/40",
        };
      case "pending":
        return {
          accentBorder: "border-l-4 border-l-[#f59e0b]",
          iconBg: "bg-[#fffbeb] text-[#b45309]",
          badgeColor: "bg-[#f59e0b]/15 text-[#b7791f] border-[#f59e0b]/30",
          glow: "group-hover:border-[#f59e0b]/40",
        };
      case "default":
      default:
        return {
          accentBorder: "border-l-4 border-l-[#1e90ff]",
          iconBg: "bg-[#e8f4fd] text-[#1e90ff]",
          badgeColor: "bg-[#1e90ff]/15 text-[#2b6cb0] border-[#1e90ff]/30",
          glow: "group-hover:border-[#1e90ff]/40",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group relative skeuo-panel p-5 transition-all duration-200 cursor-pointer select-none overflow-hidden ${
        styles.accentBorder
      } ${
        isActive
          ? "skeuo-btn-active ring-2 ring-accent-orange/60"
          : "hover:-translate-y-1 hover:shadow-skeuo-raised-hover"
      }`}
    >
      {/* Hardware Screw Details in 4 Corners */}
      <span className="screw-head absolute top-2.5 left-2.5 opacity-80" />
      <span className="screw-head absolute top-2.5 right-2.5 opacity-80" />
      <span className="screw-head absolute bottom-2.5 left-2.5 opacity-80" />
      <span className="screw-head absolute bottom-2.5 right-2.5 opacity-80" />

      {/* Ventilation slots subtle decoration */}
      <div className="absolute top-2.5 right-8 flex gap-1 opacity-40">
        <span className="vent-slot h-2 w-1" />
        <span className="vent-slot h-2 w-1" />
        <span className="vent-slot h-2 w-1" />
      </div>

      <div className="flex items-start justify-between gap-4 mt-1">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-text-primary">
              {value}
            </span>
            {badgeText && (
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border shadow-[inset_1px_1px_2px_#babecc] ${styles.badgeColor}`}
              >
                {badgeText}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-text-muted leading-relaxed">
            {subtext}
          </p>
        </div>

        {/* Recessed Icon Well */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center skeuo-recessed ${styles.iconBg} transition-transform group-hover:scale-105`}
        >
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>

      {/* Bottom chassis hairline */}
      <div className="mt-3 pt-2 border-t border-[#d1d9e6]/50 flex items-center justify-between text-[11px] font-mono text-text-muted">
        <span>AICTE SPEC: 2026.04</span>
        <span className="flex items-center gap-1 text-accent-orange font-semibold group-hover:translate-x-1 transition-transform">
          Filter View &rarr;
        </span>
      </div>
    </div>
  );
}

import React from 'react';

/**
 * StatusBadge Component
 * Follows the Industrial Skeuomorphism design system with physical recessed pill housings
 * and illuminated LED status indicators.
 */
export function StatusBadge({ status, size = "md" }) {
  const getStatusConfig = (st) => {
    switch (st) {
      case 'Verified':
        return {
          label: 'Verified',
          ledClass: 'led-green',
          bgClass: 'bg-[#eafaf1] text-[#1b7943] border-[#b7ebcd]',
          insetClass: 'shadow-[inset_1px_1px_2px_#babecc,inset_-1px_-1px_2px_#ffffff]',
        };
      case 'Pending':
        return {
          label: 'Pending',
          ledClass: 'led-amber',
          bgClass: 'bg-[#fff8e6] text-[#b7791f] border-[#fbd38d]',
          insetClass: 'shadow-[inset_1px_1px_2px_#babecc,inset_-1px_-1px_2px_#ffffff]',
        };
      case 'Discrepancy':
        return {
          label: 'Discrepancy',
          ledClass: 'led-red',
          bgClass: 'bg-[#fff0f2] text-[#c53030] border-[#feb2b2]',
          insetClass: 'shadow-[inset_1px_1px_2px_#babecc,inset_-1px_-1px_2px_#ffffff]',
        };
      case 'Expiring Soon':
        return {
          label: 'Expiring Soon',
          ledClass: 'led-amber',
          bgClass: 'bg-[#fff5eb] text-[#c05621] border-[#fbd38d]',
          insetClass: 'shadow-[inset_1px_1px_2px_#babecc,inset_-1px_-1px_2px_#ffffff]',
        };
      default:
        return {
          label: st || 'Unknown',
          ledClass: 'led-blue',
          bgClass: 'bg-chassis text-text-muted border-recessed-dark',
          insetClass: 'shadow-[inset_1px_1px_2px_#babecc,inset_-1px_-1px_2px_#ffffff]',
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-mono font-medium border ${config.bgClass} ${config.insetClass} ${sizeClasses} select-none transition-all`}
    >
      <span className={`led-indicator ${config.ledClass}`} />
      <span>{config.label}</span>
    </span>
  );
}

/**
 * PriorityBadge Component
 */
export function PriorityBadge({ priority }) {
  const getPriorityStyle = (p) => {
    switch (p) {
      case 'Critical':
        return {
          text: 'CRITICAL',
          classes: 'bg-[#ff4757]/10 text-[#d63031] border-[#ff4757]/30 shadow-[inset_1px_1px_2px_#babecc]',
          dotColor: 'bg-[#d63031]'
        };
      case 'High':
        return {
          text: 'HIGH',
          classes: 'bg-[#ff6b35]/10 text-[#e65100] border-[#ff6b35]/30 shadow-[inset_1px_1px_2px_#babecc]',
          dotColor: 'bg-[#ff6b35]'
        };
      case 'Medium':
        return {
          text: 'MEDIUM',
          classes: 'bg-[#e67e22]/10 text-[#d35400] border-[#e67e22]/30 shadow-[inset_1px_1px_2px_#babecc]',
          dotColor: 'bg-[#e67e22]'
        };
      case 'Standard':
      default:
        return {
          text: 'STANDARD',
          classes: 'bg-panel text-text-muted border-recessed shadow-[inset_1px_1px_2px_#babecc]',
          dotColor: 'bg-[#718096]'
        };
    }
  };

  const style = getPriorityStyle(priority);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${style.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />
      {style.text}
    </span>
  );
}

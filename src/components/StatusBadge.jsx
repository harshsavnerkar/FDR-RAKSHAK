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
export function PriorityBadge({ priority, score = null }) {
  const normalized = String(priority || 'Standard').toUpperCase();
  const getPriorityStyle = (p) => {
    switch (p) {
      case 'CRITICAL':
        return {
          text: 'CRITICAL',
          classes: 'bg-[#ff4757]/10 text-[#d63031] border-[#ff4757]/30 shadow-[inset_1px_1px_2px_#babecc]',
          dotColor: 'bg-[#d63031]'
        };
      case 'HIGH':
        return {
          text: 'HIGH',
          classes: 'bg-[#ff6b35]/10 text-[#e65100] border-[#ff6b35]/30 shadow-[inset_1px_1px_2px_#babecc]',
          dotColor: 'bg-[#ff6b35]'
        };
      case 'MEDIUM':
        return {
          text: 'MEDIUM',
          classes: 'bg-[#e67e22]/10 text-[#d35400] border-[#e67e22]/30 shadow-[inset_1px_1px_2px_#babecc]',
          dotColor: 'bg-[#e67e22]'
        };
      case 'LOW':
      case 'STANDARD':
      default:
        return {
          text: p === 'LOW' ? 'LOW' : 'STANDARD',
          classes: 'bg-panel text-text-muted border-recessed shadow-[inset_1px_1px_2px_#babecc]',
          dotColor: 'bg-[#718096]'
        };
    }
  };

  const style = getPriorityStyle(normalized);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${style.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`} />
      <span>{style.text}</span>
      {score !== null && (
        <span className="text-[9px] opacity-75 font-normal ml-0.5">({score})</span>
      )}
    </span>
  );
}

/**
 * MaturityBadge Component (Step 6)
 */
export function MaturityBadge({ category, daysRemaining = null, showDays = true }) {
  const normalized = String(category || 'UNKNOWN').toUpperCase();

  const getConfig = (cat) => {
    switch (cat) {
      case 'EXPIRED':
        return {
          label: 'EXPIRED',
          classes: 'bg-[#fff0f2] text-[#c53030] border-[#feb2b2]',
          dotClass: 'bg-[#c53030]'
        };
      case 'MATURING_30_DAYS':
        return {
          label: '< 30 DAYS',
          classes: 'bg-[#fff5eb] text-[#c05621] border-[#fbd38d]',
          dotClass: 'bg-[#ff6b35]'
        };
      case 'MATURING_60_DAYS':
        return {
          label: '31–60 DAYS',
          classes: 'bg-[#fff8e6] text-[#b7791f] border-[#fbd38d]',
          dotClass: 'bg-[#e67e22]'
        };
      case 'MATURING_90_DAYS':
        return {
          label: '61–90 DAYS',
          classes: 'bg-[#f0f9ff] text-[#0284c7] border-[#bae6fd]',
          dotClass: 'bg-[#0284c7]'
        };
      case 'BEYOND_90_DAYS':
        return {
          label: '> 90 DAYS',
          classes: 'bg-[#eafaf1] text-[#1b7943] border-[#b7ebcd]',
          dotClass: 'bg-[#1b7943]'
        };
      case 'UNKNOWN':
      default:
        return {
          label: 'UNKNOWN',
          classes: 'bg-[#f1f2f6] text-text-muted border-[#d1d9e6]',
          dotClass: 'bg-[#a4b0be]'
        };
    }
  };

  const cfg = getConfig(normalized);

  let daysText = '';
  if (showDays && daysRemaining !== null && daysRemaining !== undefined) {
    if (daysRemaining < 0) {
      daysText = ` (${Math.abs(daysRemaining)}d overdue)`;
    } else if (daysRemaining === 0) {
      daysText = ' (Today)';
    } else {
      daysText = ` (${daysRemaining}d)`;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border select-none ${cfg.classes} shadow-[inset_1px_1px_2px_#babecc,inset_-1px_-1px_2px_#ffffff]`}
      title={daysRemaining !== null ? `Maturity: ${daysRemaining} days remaining` : cfg.label}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      <span>{cfg.label}{daysText}</span>
    </span>
  );
}

/**
 * LifecycleBadge Component (Step 7)
 */
export function LifecycleBadge({ status }) {
  const normalized = String(status || 'ACTIVE').toUpperCase();

  const getConfig = (st) => {
    switch (st) {
      case 'ACTIVE':
        return {
          label: 'ACTIVE',
          classes: 'bg-[#eafaf1] text-[#1b7943] border-[#b7ebcd]',
          dotClass: 'bg-[#1b7943]'
        };
      case 'RENEWAL_PENDING':
        return {
          label: 'RENEWAL PENDING',
          classes: 'bg-[#fff8e6] text-[#b7791f] border-[#fbd38d]',
          dotClass: 'bg-[#ff6b35]'
        };
      case 'REPLACEMENT_PENDING':
        return {
          label: 'REPLACEMENT PENDING',
          classes: 'bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]',
          dotClass: 'bg-[#0284c7]'
        };
      case 'RELEASE_REQUESTED':
        return {
          label: 'RELEASE REQUESTED',
          classes: 'bg-[#fff5eb] text-[#c05621] border-[#fbd38d]',
          dotClass: 'bg-[#ff6b35]'
        };
      case 'RELEASE_APPROVED':
        return {
          label: 'RELEASE APPROVED',
          classes: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
          dotClass: 'bg-[#2563eb]'
        };
      case 'RELEASED':
        return {
          label: 'RELEASED / CLOSED',
          classes: 'bg-[#f1f2f6] text-[#4b5563] border-[#d1d9e6]',
          dotClass: 'bg-[#6b7280]'
        };
      case 'REJECTED':
        return {
          label: 'REJECTED',
          classes: 'bg-[#fff0f2] text-[#c53030] border-[#feb2b2]',
          dotClass: 'bg-[#c53030]'
        };
      default:
        return {
          label: st,
          classes: 'bg-panel text-text-muted border-recessed',
          dotClass: 'bg-[#718096]'
        };
    }
  };

  const cfg = getConfig(normalized);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border select-none ${cfg.classes} shadow-[inset_1px_1px_2px_#babecc]`}
      title={`Lifecycle State: ${cfg.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      <span>{cfg.label}</span>
    </span>
  );
}

/**
 * VerificationSourceBadge Component
 * Distinguishes between institutional self-reported submissions,
 * independently confirmed bank sources, and flagged discrepancy variances
 * (as mandated by AICTE Problem Statement 26265).
 */
export function VerificationSourceBadge({ status, source = null }) {
  if (status === 'Verified') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd] shadow-[inset_1px_1px_2px_#ffffff]"
        title="Data independently confirmed by authorized bank / financial voucher"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#1b7943]" />
        <span>Bank-Verified Source</span>
      </span>
    );
  }

  if (status === 'Discrepancy') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#fff0f2] text-[#c53030] border border-[#feb2b2] shadow-[inset_1px_1px_2px_#ffffff]"
        title="Discrepancy detected: Variance in deposit amount, maturity date, or bank details"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#c53030] animate-pulse" />
        <span>Discrepancy Flagged</span>
      </span>
    );
  }

  if (status === 'Expiring Soon') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#fff5eb] text-[#c05621] border-[#fbd38d] shadow-[inset_1px_1px_2px_#ffffff]"
        title="Bank-confirmed instrument approaching maturity deadline"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b35]" />
        <span>Bank Source (Expiring)</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#f0f4f8] text-[#2b6cb0] border border-[#bee3f8] shadow-[inset_1px_1px_2px_#ffffff]"
      title="Data self-reported by institution during initial intake; pending independent bank verification"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#2b6cb0]" />
      <span>Institutional Submission</span>
    </span>
  );
}

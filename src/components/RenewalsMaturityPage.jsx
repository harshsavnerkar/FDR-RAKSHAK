import React, { useState } from 'react';
import {
  CalendarClock,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Eye,
  RefreshCw,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { PrioritizedActionQueue } from './PrioritizedActionQueue';

export function RenewalsMaturityPage({
  records = [],
  onViewDetails,
  onInitiateRenewal,
  onNavigateToRepository
}) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl skeuo-panel border-l-4 border-l-accent-orange flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-9 h-9 rounded-xl skeuo-btn-accent flex items-center justify-center flex-shrink-0 shadow-md">
            <CalendarClock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold uppercase text-text-primary flex items-center gap-2">
              <span>Maturity Radar & Statutory Renewal Queue</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-accent-orange/15 text-accent-orange font-bold">
                REGULATION ACTIVE
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Automated horizon tracking and explainable risk-based prioritization for institutional security deposits under AICTE lien.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg skeuo-recessed text-text-muted">
            Monitored Instruments: <strong className="text-text-primary">{records.length}</strong>
          </span>
        </div>
      </div>

      {/* Main Prioritized Action Queue Engine */}
      <PrioritizedActionQueue
        records={records}
        onViewDetails={onViewDetails}
        onNavigateToRepository={onNavigateToRepository}
      />
    </div>
  );
}

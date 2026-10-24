import React from 'react';
import { History, Shield, AlertTriangle, CheckCircle2, Clock, Terminal } from 'lucide-react';
import { SAMPLE_ACTIVITY_FEED } from '../data/sampleFdrData';

export function RecentActivity({ onInspectLog }) {
  const getEventIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <span className="led-indicator led-red" />;
      case 'warning':
        return <span className="led-indicator led-amber" />;
      case 'success':
        return <span className="led-indicator led-green" />;
      case 'info':
      default:
        return <span className="led-indicator led-blue" />;
    }
  };

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
            LIVE AUDIT TRAIL FEED
          </span>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <span>Recent Bureau Activity</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-panel border border-[#babecc] text-text-muted">
              AUTO-LOG
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-accent-orange" />
          <span className="text-xs font-mono text-text-muted">STREAM ACTIVE</span>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="mt-4 space-y-3">
        {SAMPLE_ACTIVITY_FEED.map((event) => (
          <div
            key={event.id}
            className="p-3 rounded-xl skeuo-recessed-shallow border border-[#babecc]/60 hover:bg-panel transition-all"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-1 flex-shrink-0">
                {getEventIcon(event.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-semibold text-text-muted truncate">
                    {event.user}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                    {event.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-primary font-sans leading-relaxed">
                  {event.action}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[#d1d9e6] flex items-center justify-between text-xs font-mono">
        <span className="text-text-muted">AICTE Regulatory Compliance Seal #8904</span>
        <button
          onClick={() => onInspectLog ? onInspectLog() : alert("Audit Trail full export.")}
          className="text-accent-orange font-bold hover:underline flex items-center gap-1"
        >
          <span>Open Full Audit Vault</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
}

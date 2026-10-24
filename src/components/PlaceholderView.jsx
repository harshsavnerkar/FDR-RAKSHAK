import React from 'react';
import {
  Layers,
  ArrowLeft,
  Building2,
  FolderArchive,
  ScanLine,
  CalendarClock,
  FileCheck2,
  BarChart3,
  History,
  Settings,
  Sparkles,
  Info,
  ShieldCheck,
  Cpu,
  Database
} from 'lucide-react';

export function PlaceholderView({ viewName, onReturnToOverview, onOpenActionModal }) {
  const getSectionMetadata = (name) => {
    switch (name) {
      case "Institutions":
        return {
          icon: Building2,
          tagline: "Institutional Registry & PID Directory",
          description:
            "Directory of approved technical institutes, colleges, trusts and polytechnics under AICTE regulation.",
          stats: [
            { label: "Approved Institutes", value: "1,420" },
            { label: "Active Affiliations", value: "1,398" },
            { label: "State Directorates", value: "36" },
          ],
          primaryAction: "Register New Institute PID",
        };
      case "FDR Repository":
        return {
          icon: FolderArchive,
          tagline: "Central Fixed Deposit Receipt Depository",
          description:
            "Electronic vault archiving all original bank FDR receipts, tripartite lien letters, and custody serials.",
          stats: [
            { label: "Vaulted Instruments", value: "2,840" },
            { label: "Total Corpus Under Custody", value: "₹482.50 Cr" },
            { label: "Designated Vault Lockers", value: "8" },
          ],
          primaryAction: "Upload Intake Certificate Scan",
        };
      case "AI Verification":
        return {
          icon: ScanLine,
          tagline: "AI OCR Pipeline & Discrepancy Detector",
          description:
            "Automated optical character recognition comparing scanned FDR certificates against bank CBS core records, joint lien endorsements, and signature matches.",
          stats: [
            { label: "Average OCR Match Rate", value: "98.4%" },
            { label: "Queue Awaiting Human Audit", value: "14" },
            { label: "Bank Seal Verification Engine", value: "Active" },
          ],
          primaryAction: "Run OCR Intake Verification",
        };
      case "Renewals & Maturity":
        return {
          icon: CalendarClock,
          tagline: "Maturity Radar & Auto-Renewal Dispatcher",
          description:
            "Predictive tracking of fixed deposit maturity milestones with automated 60-day, 30-day, and 15-day regulatory reminder notices.",
          stats: [
            { label: "Maturing in < 30 Days", value: "2" },
            { label: "Maturing in < 90 Days", value: "7" },
            { label: "Dispatched Notices This Month", value: "19" },
          ],
          primaryAction: "Generate Batch Renewal Notices",
        };
      case "Release Requests":
        return {
          icon: FileCheck2,
          tagline: "Security Deposit Discharge & NOC Processing",
          description:
            "Workflows for releasing institutional security deposits upon valid course closure, trust dissolution, or bank guarantee substitutions.",
          stats: [
            { label: "Pending Release Applications", value: "5" },
            { label: "NOCs Issued (FY 2026-27)", value: "32" },
            { label: "Executive Committee Clearance", value: "Pending" },
          ],
          primaryAction: "Initiate Release Verification",
        };
      case "Reports & Analytics":
        return {
          icon: BarChart3,
          tagline: "Regulatory Intelligence & Fiscal Audits",
          description:
            "Comprehensive state-wise, bank-wise, and institution-tier breakdowns of security deposit compliance.",
          stats: [
            { label: "Generated Quarterly Reports", value: "12" },
            { label: "Compliance Index", value: "94.6%" },
            { label: "Scheduled Audit Export", value: "Weekly" },
          ],
          primaryAction: "Generate Custom Audit Report",
        };
      case "Audit Trail":
        return {
          icon: History,
          tagline: "Cryptographic Tamper-Evident Ledger",
          description:
            "Immutable audit trail logging every administrative review, OCR scan, bank verification ping, and status update with SHA-256 fingerprinting.",
          stats: [
            { label: "Total Ledger Transactions", value: "14,920" },
            { label: "Integrity Verification", value: "VERIFIED" },
            { label: "Sync Latency", value: "< 24ms" },
          ],
          primaryAction: "Export Signed Audit Ledger",
        };
      case "Settings":
      default:
        return {
          icon: Settings,
          tagline: "Bureau System & Security Configuration",
          description:
            "Administrative parameters, bank API webhook credentials, AI OCR threshold settings, and regional officer role mappings.",
          stats: [
            { label: "System Protocol Version", value: "v1.0.4-REG" },
            { label: "Encryption Mode", value: "AES-256 GCM" },
            { label: "AICTE Gateway Node", value: "HQ New Delhi" },
          ],
          primaryAction: "Update System Preferences",
        };
    }
  };

  const meta = getSectionMetadata(viewName);
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      
      {/* Return to Overview Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReturnToOverview}
          className="skeuo-btn px-3 py-1.5 rounded-lg text-xs font-mono text-text-muted hover:text-text-primary flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-accent-orange" />
          <span>&larr; Return to Live Overview Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
          <span className="led-indicator led-green" />
          <span>Module Staged: {viewName}</span>
        </div>
      </div>

      {/* Main Module Panel */}
      <div className="skeuo-panel p-6 sm:p-8 relative overflow-hidden">
        {/* Hardware Screws at 4 corners */}
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />
        <span className="screw-head absolute bottom-3 left-3 opacity-80" />
        <span className="screw-head absolute bottom-3 right-3 opacity-80" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#d1d9e6]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl skeuo-recessed flex items-center justify-center text-accent-orange flex-shrink-0">
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
                  AICTE REGULATION BUREAU
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent-orange/15 text-accent-orange font-bold border border-accent-orange/30">
                  STAGE 1 UI STAGED
                </span>
              </div>
              <h2 className="text-2xl font-bold text-text-primary tracking-tight mt-1">
                {viewName}
              </h2>
              <p className="text-xs font-mono text-accent-orange font-semibold mt-0.5">
                {meta.tagline}
              </p>
              <p className="mt-2 text-xs text-text-muted max-w-2xl leading-relaxed font-sans">
                {meta.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenActionModal ? onOpenActionModal(meta.primaryAction) : alert(`Action triggered: ${meta.primaryAction}`)}
            className="skeuo-btn-accent px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 self-start"
          >
            <Sparkles className="w-4 h-4" />
            <span>{meta.primaryAction}</span>
          </button>
        </div>

        {/* Mock Metrics / Stats Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {meta.stats.map((st, idx) => (
            <div key={idx} className="p-4 rounded-xl skeuo-recessed">
              <span className="text-[11px] font-mono text-text-muted uppercase">
                {st.label}
              </span>
              <div className="text-2xl font-bold font-mono text-text-primary mt-1">
                {st.value}
              </div>
              <div className="mt-2 text-[10px] font-mono text-[#1b7943] flex items-center gap-1">
                <span className="led-indicator led-green" />
                <span>Simulated Module Telemetry</span>
              </div>
            </div>
          ))}
        </div>

        {/* Honest Step 1 Notice Banner */}
        <div className="mt-6 p-4 rounded-xl skeuo-recessed border border-[#babecc] bg-[#d9e2ee]/60">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-accent-orange flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                Stage 1 Architectural Scope
              </h4>
              <p className="mt-1 text-xs text-text-muted leading-relaxed font-sans">
                You are currently viewing the frontend design system foundation for <strong>{viewName}</strong>. 
                As specified for Step 1, backend API integrations, live database connections, OCR deep neural inference, 
                and bank webhook synchronizations are intentionally kept as clean simulated interfaces to allow thorough 
                design review and administrative UI validation before full services coupling.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Footer */}
        <div className="mt-6 pt-4 border-t border-[#d1d9e6] flex flex-wrap items-center justify-between text-[11px] font-mono text-text-muted gap-2">
          <span>AICTE Security Deposit Policy Guidelines (Revised Handbook 2026)</span>
          <span className="text-accent-orange font-semibold">Ready for Step 2 Backend Coupling</span>
        </div>

      </div>

    </div>
  );
}

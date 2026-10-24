import React from 'react';
import {
  X,
  Building,
  Landmark,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileText,
  Printer,
  Send,
  Lock,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { formatINR, formatDate } from '../data/sampleFdrData';

export function RecordDetailsModal({ record, onClose, onActionTrigger }) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2d3436]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-3xl skeuo-panel-elevated shadow-skeuo-modal my-8 z-10 overflow-hidden border-2 border-white/90">
        
        {/* Hardware Screws at 4 corners */}
        <span className="screw-head absolute top-3 left-3 opacity-90" />
        <span className="screw-head absolute top-3 right-3 opacity-90" />
        <span className="screw-head absolute bottom-3 left-3 opacity-90" />
        <span className="screw-head absolute bottom-3 right-3 opacity-90" />

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#d1d9e6] bg-[#f0f2f5]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#d1d9e6] text-text-muted border border-[#babecc]">
                  OFFICIAL FDR DOSSIER
                </span>
                <span className="text-xs font-mono text-text-muted">
                  REF: <strong className="text-text-primary">{record.reference}</strong>
                </span>
              </div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                {record.institution}
              </h2>
              <p className="text-xs font-mono text-text-muted mt-0.5">
                Institute Code: <span className="text-accent-orange font-bold">{record.institutionCode}</span> | Trust: {record.trust}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="skeuo-btn p-2 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status & Priority Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <StatusBadge status={record.verificationStatus} />
            <PriorityBadge priority={record.priority} />
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-panel border border-[#babecc] text-text-muted">
              Region: <strong>{record.region}</strong>
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-panel border border-[#babecc] text-text-muted">
              Category: <strong>{record.category}</strong>
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          
          {/* Main Deposit Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl skeuo-recessed">
              <span className="text-[11px] font-mono text-text-muted uppercase">Security Deposit Amount</span>
              <div className="text-2xl font-bold font-mono text-text-primary mt-1">
                {formatINR(record.depositAmount)}
              </div>
              <span className="text-[10px] font-mono text-accent-orange">
                Interest: {record.interestRate} p.a.
              </span>
            </div>

            <div className="p-3.5 rounded-xl skeuo-recessed">
              <span className="text-[11px] font-mono text-text-muted uppercase">Maturity Timeline</span>
              <div className="text-sm font-bold font-mono text-text-primary mt-1">
                {formatDate(record.maturityDate)}
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                Issued: {formatDate(record.issueDate)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl skeuo-recessed">
              <span className="text-[11px] font-mono text-text-muted uppercase">AI OCR Audit Match</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-[#1b7943]">
                  {record.ocrConfidence}%
                </span>
                <Sparkles className="w-4 h-4 text-[#1b7943]" />
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                Automated Verification
              </span>
            </div>
          </div>

          {/* Section 1: Bank & Certificate Metadata */}
          <div className="p-4 rounded-xl bg-panel border border-[#d1d9e6] shadow-[inset_1px_1px_2px_#ffffff]">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-accent-orange" />
              <span>Issuing Bank & Instrument Credentials</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-text-muted">Bank Name:</span>
                <p className="font-semibold text-text-primary">{record.bankName}</p>
              </div>

              <div>
                <span className="text-text-muted">Branch Location:</span>
                <p className="font-semibold text-text-primary">{record.branch}</p>
              </div>

              <div>
                <span className="text-text-muted">IFSC Code:</span>
                <p className="font-semibold text-text-primary">{record.ifsc}</p>
              </div>

              <div>
                <span className="text-text-muted">Fixed Deposit Certificate No:</span>
                <p className="font-semibold text-text-primary">{record.certificateNo}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Lien Clause & Physical Custody */}
          <div className="p-4 rounded-xl bg-panel border border-[#d1d9e6] shadow-[inset_1px_1px_2px_#ffffff]">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent-orange" />
              <span>Lien & Bureau Custody Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-text-muted">Joint Account Lien Holder:</span>
                <p className="font-semibold text-text-primary">{record.jointLienHolder}</p>
              </div>

              <div>
                <span className="text-text-muted">Current Lien Status:</span>
                <p className="font-semibold text-text-primary">{record.lienStatus}</p>
              </div>

              <div>
                <span className="text-text-muted">Physical Custody Location:</span>
                <p className="font-semibold text-text-primary">{record.physicalLocation}</p>
              </div>

              <div>
                <span className="text-text-muted">Last Physical Audit Date:</span>
                <p className="font-semibold text-text-primary">{formatDate(record.lastAudited)}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Discrepancy & Administrative Observations */}
          <div className="p-4 rounded-xl skeuo-recessed border border-[#babecc]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent-orange flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">
                  Regulatory Notes & Discrepancy Log
                </h4>
                <p className="mt-1 text-xs text-text-primary leading-relaxed font-sans">
                  {record.discrepancyNote}
                </p>
                <div className="mt-2 text-[10px] font-mono text-text-muted">
                  Flagged by AICTE Regulation Bureau Automated Sentry Engine. All actions recorded in Immutable Audit Trail.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer / Physical Action Buttons */}
        <div className="px-6 py-4 bg-[#e8edf4] border-t border-[#d1d9e6] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-text-muted flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-text-muted" />
            <span>AICTE RECORD ID: {record.id}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onActionTrigger("Print Custody Slip", record)}
              className="skeuo-btn px-3.5 py-2 text-xs font-mono rounded-lg flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-text-muted" />
              <span>Print Slip</span>
            </button>

            <button
              onClick={() => onActionTrigger("Issue Renewal Notice", record)}
              className="skeuo-btn px-3.5 py-2 text-xs font-mono rounded-lg flex items-center gap-1.5 text-accent-orange"
            >
              <Send className="w-4 h-4" />
              <span>Issue Notice</span>
            </button>

            <button
              onClick={onClose}
              className="skeuo-btn-accent px-4 py-2 text-xs font-mono rounded-lg shadow-md"
            >
              Close Dossier
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

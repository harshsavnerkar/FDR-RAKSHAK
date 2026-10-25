import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  FileCheck2,
  FileX,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Building,
  Landmark,
  ShieldCheck,
  RefreshCw,
  Info,
  Calendar,
  Lock,
  ArrowRight,
  X
} from 'lucide-react';
import { LifecycleBadge, PriorityBadge } from './StatusBadge';
import { formatINR, formatDate } from '../data/sampleFdrData';
import { api } from '../services/api';

export function LifecycleWorkflowView({ fdrId, onWorkflowUpdated, initialFormType = null }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Workflow Initiation Modal State ('RENEWAL' | 'REPLACEMENT' | 'RELEASE' | null)
  const [activeFormType, setActiveFormType] = useState(initialFormType);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (initialFormType) {
      setActiveFormType(initialFormType);
    }
  }, [initialFormType]);

  // Form Fields
  // Renewal
  const [renewReason, setRenewReason] = useState('');
  const [renewDate, setRenewDate] = useState('');
  const [renewInterest, setRenewInterest] = useState('');
  const [renewCertNo, setRenewCertNo] = useState('');

  // Auto pre-fill renewal fields from overview
  useEffect(() => {
    if (overview && activeFormType === 'RENEWAL') {
      if (!renewDate) {
        try {
          const baseDate = overview.currentMaturityDate ? new Date(overview.currentMaturityDate) : new Date();
          const targetYear = (isNaN(baseDate.getFullYear()) ? new Date().getFullYear() : baseDate.getFullYear()) + 3;
          const month = String(baseDate.getMonth() + 1).padStart(2, '0');
          const day = String(baseDate.getDate()).padStart(2, '0');
          setRenewDate(`${targetYear}-${month}-${day}`);
        } catch {
          // fallback
        }
      }
      if (!renewReason) {
        setRenewReason(`Statutory 3-Year Tripartite Renewal under AICTE APH for ${overview.institutionName || 'institution'}.`);
      }
    }
  }, [overview, activeFormType]);

  // Replacement
  const [replaceReason, setReplaceReason] = useState('');
  const [replaceRef, setReplaceRef] = useState('');
  const [replaceCertNo, setReplaceCertNo] = useState('');
  const [replaceJustification, setReplaceJustification] = useState('Damaged physical certificate');

  // Release
  const [releaseReason, setReleaseReason] = useState('');
  const [releaseOrderNo, setReleaseOrderNo] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [releaseAccount, setReleaseAccount] = useState('');

  // Decision Modal State ({ workflowId, decision: 'APPROVED' | 'REJECTED' } | null)
  const [decisionModal, setDecisionModal] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decidedBy, setDecidedBy] = useState('AICTE Bureau Approving Authority');

  const fetchOverview = async () => {
    if (!fdrId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFdrLifecycleOverview(fdrId);
      setOverview(data);
    } catch (err) {
      console.warn('Failed to load FDR lifecycle overview:', err);
      setError(err.message || 'Cannot retrieve lifecycle overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [fdrId]);

  // Handle Workflow Initiation
  const handleSubmitInitiate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (activeFormType === 'RENEWAL') {
        if (!renewDate) throw new Error('Proposed new maturity date is required.');
        if (!renewReason.trim()) throw new Error('Administrative renewal justification is required.');

        await api.initiateRenewal(fdrId, {
          reason: renewReason,
          proposedMaturityDate: renewDate,
          proposedInterestRate: renewInterest || null,
          renewalCertificateNo: renewCertNo || null
        });
      } else if (activeFormType === 'REPLACEMENT') {
        if (!replaceRef.trim()) throw new Error('New replacement reference number is required.');
        if (!replaceReason.trim()) throw new Error('Replacement reason is required.');

        await api.initiateReplacement(fdrId, {
          reason: replaceReason,
          newReference: replaceRef,
          newCertificateNo: replaceCertNo || null,
          replacementReason: replaceJustification
        });
      } else if (activeFormType === 'RELEASE') {
        if (!releaseOrderNo.trim()) throw new Error('Release sanction order reference is required.');
        if (!releaseReason.trim()) throw new Error('Statutory release justification is required.');

        await api.initiateRelease(fdrId, {
          reason: releaseReason,
          releaseOrderNumber: releaseOrderNo,
          orderDate: releaseDate || null,
          settlementAccountDetails: releaseAccount || null
        });
      }

      // Reset form & reload
      setActiveFormType(null);
      resetForms();
      await fetchOverview();
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err) {
      setFormError(err.message || 'Failed to initiate workflow.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForms = () => {
    setRenewReason('');
    setRenewDate('');
    setRenewInterest('');
    setRenewCertNo('');
    setReplaceReason('');
    setReplaceRef('');
    setReplaceCertNo('');
    setReleaseReason('');
    setReleaseOrderNo('');
    setReleaseDate('');
    setReleaseAccount('');
    setFormError(null);
  };

  // Handle Workflow Decision (Approve / Reject)
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionModal) return;
    if (!decisionNotes.trim()) {
      alert('Please provide decision notes for audit record.');
      return;
    }

    setSubmitting(true);
    try {
      await api.decideWorkflow(decisionModal.workflowId, {
        decision: decisionModal.decision,
        decidedBy: decidedBy || 'AICTE Approving Authority',
        decisionNotes: decisionNotes
      });
      setDecisionModal(null);
      setDecisionNotes('');
      await fetchOverview();
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err) {
      alert(`Decision error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-mono text-text-muted animate-pulse">
        <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-accent-orange" />
        Loading controlled lifecycle states and immutable workflow audit history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-[#fff0f2] border border-[#feb2b2] text-[#c53030] text-xs font-mono flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Lifecycle service error: {error}</span>
        </div>
        <button
          onClick={fetchOverview}
          className="skeuo-btn px-2.5 py-1 text-xs font-mono text-text-primary rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!overview) return null;

  const isPending = !!overview.activeWorkflow;
  const isReleased = overview.lifecycleStatus === 'RELEASED';

  return (
    <div className="space-y-5">
      {/* Top Banner: Current Lifecycle Status Bar */}
      <div className="p-4 rounded-xl skeuo-panel border-l-4 border-l-accent-orange flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LifecycleBadge status={overview.lifecycleStatus} />
            <span className="text-xs font-mono font-bold text-text-primary">
              REF: {overview.reference}
            </span>
          </div>
          <p className="text-xs text-text-muted font-sans">
            Maturity: <strong className="text-text-primary font-mono">{formatDate(overview.currentMaturityDate)}</strong> | Amount: <strong className="text-accent-orange font-mono">{formatINR(overview.depositAmount, true)}</strong>
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="skeuo-btn px-2.5 py-1.5 rounded-lg text-xs font-mono text-text-muted hover:text-text-primary flex items-center gap-1.5 self-start sm:self-center"
          title="Refresh Lifecycle Status"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Active Pending Request Alert Box (If Pending Approval) */}
      {isPending && (
        <div className="p-4 rounded-xl bg-[#fffaf0] border-2 border-[#ffd166] shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#b36b00] animate-pulse" />
              <h4 className="text-xs font-mono font-bold uppercase text-[#b36b00]">
                Pending Administrative Action: {overview.activeWorkflow.workflowType} Request
              </h4>
            </div>
            <span className="text-[10px] font-mono text-text-muted bg-white px-2 py-0.5 rounded border border-[#d1d9e6]">
              {overview.activeWorkflow.id}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <p className="text-text-primary">
              <strong>Justification: </strong> {overview.activeWorkflow.reason}
            </p>
            <p className="text-text-muted text-[11px] font-mono">
              Requested by <strong>{overview.activeWorkflow.requestedBy}</strong> on {overview.activeWorkflow.requestDate}
            </p>

            {/* Proposed changes details */}
            {overview.activeWorkflow.proposedChanges && (
              <div className="mt-2 p-2.5 rounded bg-white border border-[#ffd166] text-xs font-mono space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-muted">Proposed Changes:</span>
                {overview.activeWorkflow.workflowType === 'RENEWAL' && (
                  <div className="grid grid-cols-2 gap-2 text-text-primary">
                    <div>New Maturity: <strong>{overview.activeWorkflow.proposedChanges.proposedMaturityDate}</strong></div>
                    <div>Interest: <strong>{overview.activeWorkflow.proposedChanges.proposedInterestRate || 'Same as original'}</strong></div>
                  </div>
                )}
                {overview.activeWorkflow.workflowType === 'REPLACEMENT' && (
                  <div className="grid grid-cols-2 gap-2 text-text-primary">
                    <div>New Reference: <strong>{overview.activeWorkflow.proposedChanges.newReference}</strong></div>
                    <div>Certificate No: <strong>{overview.activeWorkflow.proposedChanges.newCertificateNo || 'N/A'}</strong></div>
                  </div>
                )}
                {overview.activeWorkflow.workflowType === 'RELEASE' && (
                  <div className="grid grid-cols-2 gap-2 text-text-primary">
                    <div>Order Ref: <strong>{overview.activeWorkflow.proposedChanges.releaseOrderNumber}</strong></div>
                    <div>Account: <strong>{overview.activeWorkflow.proposedChanges.settlementAccountDetails || 'On File'}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Decision Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setDecisionModal({ workflowId: overview.activeWorkflow.id, decision: 'APPROVED' })}
              className="skeuo-btn-accent px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 bg-[#1b7943] text-white hover:bg-[#166534]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve {overview.activeWorkflow.workflowType}</span>
            </button>

            <button
              onClick={() => setDecisionModal({ workflowId: overview.activeWorkflow.id, decision: 'REJECTED' })}
              className="skeuo-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 text-[#cf1322] hover:bg-[#fff1f0]"
            >
              <FileX className="w-3.5 h-3.5" />
              <span>Reject Request</span>
            </button>
          </div>
        </div>
      )}

      {/* Initiation Action Triggers (Visible only when ACTIVE) */}
      {!isPending && !isReleased && (
        <div className="p-4 rounded-xl skeuo-panel space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase text-text-muted flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-accent-cyan" />
              <span>Controlled Lifecycle Action Triggers</span>
            </h4>
            <span className="text-[10px] font-mono text-text-muted">Requires Approval</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => { resetForms(); setActiveFormType('RENEWAL'); }}
              className="p-3 rounded-xl skeuo-recessed text-left hover:border-accent-orange transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-text-primary group-hover:text-accent-orange">
                <RotateCcw className="w-4 h-4 text-accent-orange" />
                <span>Request Renewal</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                Extend deposit tenure with a new maturity date upon institution renewal sanction.
              </p>
            </button>

            <button
              onClick={() => { resetForms(); setActiveFormType('REPLACEMENT'); }}
              className="p-3 rounded-xl skeuo-recessed text-left hover:border-accent-cyan transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-text-primary group-hover:text-accent-cyan">
                <FileCheck2 className="w-4 h-4 text-accent-cyan" />
                <span>Request Replacement</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                Replace damaged, re-issued, or merged instrument while preserving historical continuity.
              </p>
            </button>

            <button
              onClick={() => { resetForms(); setActiveFormType('RELEASE'); }}
              className="p-3 rounded-xl skeuo-recessed text-left hover:border-[#1b7943] transition-all group"
            >
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-text-primary group-hover:text-[#1b7943]">
                <Send className="w-4 h-4 text-[#1b7943]" />
                <span>Request Release / Refund</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                Initiate administrative security deposit discharge following formal approval order.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Released Instrument Notice */}
      {isReleased && (
        <div className="p-4 rounded-xl skeuo-recessed text-text-muted text-xs font-mono space-y-1">
          <div className="flex items-center gap-2 text-[#4b5563] font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#1b7943]" />
            <span>INSTRUMENT FORMALLY RELEASED / DISCHARGED</span>
          </div>
          <p className="text-[11px]">
            Statutory AICTE lien has been discharged under administrative sanction. Instrument is closed in regulatory ledger.
          </p>
        </div>
      )}

      {/* Initiation Form Modal */}
      {activeFormType && (
        <div className="p-4 rounded-xl bg-[#f8fafd] border border-[#babecc] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#d1d9e6]">
            <h4 className="text-xs font-mono font-bold text-text-primary uppercase flex items-center gap-2">
              <span>Initiate Controlled {activeFormType} Workflow</span>
            </h4>
            <button
              onClick={() => setActiveFormType(null)}
              className="skeuo-btn p-1 rounded text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-2.5 rounded bg-[#fff0f2] border border-[#feb2b2] text-[#c53030] text-xs font-mono">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitInitiate} className="space-y-3 text-xs font-mono">
            {activeFormType === 'RENEWAL' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">Proposed Maturity Date *</label>
                    <input
                      type="date"
                      required
                      value={renewDate}
                      onChange={(e) => setRenewDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 skeuo-input rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">New Certificate No (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. CERT-REN-9921"
                      value={renewCertNo}
                      onChange={(e) => setRenewCertNo(e.target.value)}
                      className="w-full px-2.5 py-1.5 skeuo-input rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-text-muted mb-1">Administrative Justification / Reason *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="State justification for 3-year renewal extension..."
                    value={renewReason}
                    onChange={(e) => setRenewReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 skeuo-input rounded"
                  />
                </div>
              </>
            )}

            {activeFormType === 'REPLACEMENT' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">New Reference Identifier *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FDR-AICTE-2026-REP-9102"
                      value={replaceRef}
                      onChange={(e) => setReplaceRef(e.target.value)}
                      className="w-full px-2.5 py-1.5 skeuo-input rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">New Certificate Serial No</label>
                    <input
                      type="text"
                      placeholder="e.g. CERT-NEW-5401"
                      value={replaceCertNo}
                      onChange={(e) => setReplaceCertNo(e.target.value)}
                      className="w-full px-2.5 py-1.5 skeuo-input rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-text-muted mb-1">Replacement Justification *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Reason for replacement (e.g. physical paper certificate damaged)..."
                    value={replaceReason}
                    onChange={(e) => setReplaceReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 skeuo-input rounded"
                  />
                </div>
              </>
            )}

            {activeFormType === 'RELEASE' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">Release Order Reference Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AICTE/BUREAU/REL/2026/044"
                      value={releaseOrderNo}
                      onChange={(e) => setReleaseOrderNo(e.target.value)}
                      className="w-full px-2.5 py-1.5 skeuo-input rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-muted mb-1">Settlement Account (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. SBI A/C 30981290312"
                      value={releaseAccount}
                      onChange={(e) => setReleaseAccount(e.target.value)}
                      className="w-full px-2.5 py-1.5 skeuo-input rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-text-muted mb-1">Statutory Release Justification *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="State reason for deposit release (e.g. formal closure of course approved)..."
                    value={releaseReason}
                    onChange={(e) => setReleaseReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 skeuo-input rounded"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveFormType(null)}
                className="skeuo-btn px-3 py-1.5 rounded text-xs font-mono text-text-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="skeuo-btn-accent px-4 py-1.5 rounded text-xs font-mono font-bold"
              >
                {submitting ? 'Submitting...' : `Submit ${activeFormType} Request`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Decision Modal Confirmation Box */}
      {decisionModal && (
        <div className="p-4 rounded-xl bg-white border-2 border-accent-orange shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#d1d9e6]">
            <h4 className="text-xs font-mono font-bold text-text-primary uppercase flex items-center gap-1.5">
              <span>Confirm Bureau Decision: </span>
              <strong className={decisionModal.decision === 'APPROVED' ? 'text-[#1b7943]' : 'text-[#cf1322]'}>
                {decisionModal.decision}
              </strong>
            </h4>
            <button
              onClick={() => setDecisionModal(null)}
              className="skeuo-btn p-1 rounded text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleDecisionSubmit} className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Authorizing Officer Name / Role *</label>
              <input
                type="text"
                required
                value={decidedBy}
                onChange={(e) => setDecidedBy(e.target.value)}
                className="w-full px-2.5 py-1.5 skeuo-input rounded"
              />
            </div>

            <div>
              <label className="block text-[11px] text-text-muted mb-1">Mandatory Audit Decision Notes *</label>
              <textarea
                required
                rows={2}
                placeholder="State basis for decision (e.g. Bank confirmation letter cross-verified)..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 skeuo-input rounded"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="skeuo-btn px-3 py-1.5 rounded text-xs font-mono text-text-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-1.5 rounded text-xs font-mono font-bold text-white shadow-sm ${
                  decisionModal.decision === 'APPROVED' ? 'bg-[#1b7943] hover:bg-[#166534]' : 'bg-[#cf1322] hover:bg-[#a8071a]'
                }`}
              >
                {submitting ? 'Recording...' : `Confirm & Record ${decisionModal.decision}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workflow History Audit Log Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-mono font-bold uppercase text-text-muted px-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-text-muted" />
          <span>Workflow Request & Transition Audit Log ({overview.workflowHistory.length})</span>
        </h4>

        {overview.workflowHistory.length === 0 ? (
          <div className="p-4 rounded-xl skeuo-recessed text-center text-xs font-mono text-text-muted">
            <CheckCircle2 className="w-5 h-5 text-[#1b7943] mx-auto mb-1.5 opacity-70" />
            <span>No workflow requests have been initiated for this instrument yet. Standard active status maintained.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {overview.workflowHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl skeuo-panel border border-[#d1d9e6] space-y-2 text-xs font-mono"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary uppercase bg-[#e8edf4] px-1.5 py-0.5 rounded border border-[#d1d9e6]">
                      {item.workflowType}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      item.status === 'APPROVED'
                        ? 'bg-[#eafaf1] text-[#1b7943] border-[#b7ebcd]'
                        : item.status === 'REJECTED'
                        ? 'bg-[#fff0f2] text-[#cf1322] border-[#feb2b2]'
                        : 'bg-[#fff8e6] text-[#b7791f] border-[#fbd38d]'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted">
                    ID: {item.id} • {item.requestDate}
                  </span>
                </div>

                <p className="text-text-primary leading-relaxed font-sans text-xs">
                  <strong>Reason: </strong> {item.reason}
                </p>

                {item.decisionDate && (
                  <div className="p-2 rounded bg-chassis border border-[#d1d9e6] text-[11px] text-text-muted space-y-0.5">
                    <div>
                      <strong className="text-text-primary">Decided by: </strong> {item.decidedBy} on {new Date(item.decisionDate).toLocaleDateString()}
                    </div>
                    {item.decisionNotes && (
                      <div>
                        <strong className="text-text-primary">Decision Notes: </strong> {item.decisionNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statutory Disclaimer */}
      <div className="p-3 rounded-xl skeuo-recessed text-[11px] text-text-muted font-mono flex items-start gap-2">
        <Info className="w-4 h-4 text-accent-cyan flex-shrink-0 mt-0.5" />
        <span>
          <strong>STATUTORY SCOPE NOTICE:</strong> FDR Rakshak lifecycle workflows govern internal administrative regulatory approvals. The system does not interface with interbank RTGS/NEFT payment gateways or execute autonomous bank-side lien release.
        </span>
      </div>
    </div>
  );
}

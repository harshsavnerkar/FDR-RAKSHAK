import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  FileX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Lock,
  Building,
  Landmark,
  ArrowRight,
  ShieldCheck,
  Send,
  X
} from 'lucide-react';
import { LifecycleBadge } from './StatusBadge';
import { formatINR, formatDate } from '../data/sampleFdrData';
import { api } from '../services/api';

export function ReleaseRequestsView({
  fdrRecords = [],
  institutions = [],
  onViewDetails,
  onWorkflowUpdated,
  currentAdmin
}) {
  const role = currentAdmin?.role || 'BUREAU_CHIEF';
  const isScrutinyOfficer = role === 'SCRUTINY_OFFICER';
  const isBureauChief = role === 'BUREAU_CHIEF';
  const isInstitutionalUser = role === 'INSTITUTION_USER';
  const isBankNode = role === 'BANK_NODE';

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Decision Modal
  const [decisionItem, setDecisionItem] = useState(null);
  const [decisionType, setDecisionType] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [decisionNotes, setDecisionNotes] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState(null);

  // Initiate Release Modal for an Active FDR
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [selectedFdrId, setSelectedFdrId] = useState('');
  const [releaseReason, setReleaseReason] = useState('');
  const [releaseOrderNo, setReleaseOrderNo] = useState('');
  const [settlementAccount, setSettlementAccount] = useState('');
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState(null);

  const fetchWorkflowData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWorkflowSummary();
      setSummary(data);
    } catch (err) {
      console.warn('Failed to load workflow summary:', err);
      setError(err.message || 'Cannot retrieve release workflows.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowData();
  }, [fdrRecords]);

  // Extract release requests: pending workflows of type 'RELEASE' or FDRs with RELEASE_REQUESTED
  const releaseWorkflows = (summary?.recentWorkflows || []).filter(
    (w) => w.workflowType === 'RELEASE'
  );

  const pendingReleaseWorkflows = releaseWorkflows.filter(
    (w) => w.status === 'PENDING'
  );

  const decidedReleaseWorkflows = releaseWorkflows.filter(
    (w) => w.status !== 'PENDING'
  );

  // Active FDRs available for initiating release
  const eligibleFdrsForRelease = fdrRecords.filter(
    (f) => !f.lifecycleStatus || f.lifecycleStatus === 'ACTIVE'
  );

  // Handle human decision (Approve/Reject)
  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionItem) return;
    if (!decisionNotes.trim()) {
      setDecisionError('Mandatory administrative notes are required for this decision.');
      return;
    }

    setDeciding(true);
    setDecisionError(null);

    try {
      await api.decideWorkflow(decisionItem.id, {
        decision: decisionType,
        decidedBy: 'AICTE Approving Authority (Executive Committee)',
        decisionNotes: decisionNotes.trim()
      });

      setDecisionItem(null);
      setDecisionNotes('');
      await fetchWorkflowData();
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err) {
      setDecisionError(err.message || 'Failed to record workflow decision.');
    } finally {
      setDeciding(false);
    }
  };

  // Handle Initiate Release
  const handleInitiateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFdrId) {
      setInitiateError('Please select a valid FDR instrument.');
      return;
    }
    if (!releaseOrderNo.trim()) {
      setInitiateError('Release sanction order number is required.');
      return;
    }
    if (!releaseReason.trim()) {
      setInitiateError('Statutory justification for release is required.');
      return;
    }

    setInitiating(true);
    setInitiateError(null);

    try {
      await api.initiateRelease(selectedFdrId, {
        reason: releaseReason.trim(),
        releaseOrderNumber: releaseOrderNo.trim(),
        settlementAccountDetails: settlementAccount.trim() || null
      });

      setShowInitiateModal(false);
      setSelectedFdrId('');
      setReleaseReason('');
      setReleaseOrderNo('');
      setSettlementAccount('');
      await fetchWorkflowData();
      if (onWorkflowUpdated) onWorkflowUpdated();
    } catch (err) {
      setInitiateError(err.message || 'Failed to initiate release request.');
    } finally {
      setInitiating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl skeuo-panel border-l-4 border-l-[#2ed573] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-9 h-9 rounded-xl skeuo-btn-accent flex items-center justify-center flex-shrink-0 shadow-md">
            <FileCheck2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold uppercase text-text-primary flex items-center gap-2">
              <span>Security Deposit Discharge & Release Verification</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#2ed573]/15 text-[#1b7943] font-bold border border-[#b7ebcd]">
                HUMAN APPROVAL REQUIRED
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Controlled workflows for releasing institutional security deposits upon valid course closure, trust dissolution, or bank guarantee substitutions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInitiateModal(true)}
            className="skeuo-btn-accent px-3 py-1.5 text-xs font-mono rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Initiate Release Request</span>
          </button>
          <button
            onClick={fetchWorkflowData}
            disabled={loading}
            className="skeuo-btn p-1.5 text-text-muted hover:text-text-primary rounded-lg"
            title="Refresh from PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards based on REAL backend counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl skeuo-panel border border-[#d1d9e6]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
            Pending Release Applications
          </span>
          <div className="text-2xl font-bold font-mono text-[#ff4757] mt-1">
            {pendingReleaseWorkflows.length}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            Awaiting Executive Committee clearance
          </p>
        </div>

        <div className="p-3.5 rounded-xl skeuo-panel border border-[#d1d9e6]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
            Sanctioned Releases (NOCs Issued)
          </span>
          <div className="text-2xl font-bold font-mono text-[#1b7943] mt-1">
            {summary?.approvedCount ?? 0}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            Officially sanctioned in PostgreSQL ledger
          </p>
        </div>

        <div className="p-3.5 rounded-xl skeuo-panel border border-[#d1d9e6]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
            Vault Instruments Under Active Lien
          </span>
          <div className="text-2xl font-bold font-mono text-text-primary mt-1">
            {fdrRecords.filter(f => f.lifecycleStatus === 'ACTIVE' || !f.lifecycleStatus).length}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            Preserved under tripartite safe custody
          </p>
        </div>
      </div>

      {/* Main Panel: Pending Release Queue */}
      <div className="skeuo-panel p-5 relative overflow-hidden space-y-4">
        {/* Screws */}
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />

        <div className="flex items-center justify-between pb-3 border-b border-[#d1d9e6]">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <span className="led-indicator led-amber" />
              <span>Pending Release Decisions</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-panel border border-[#babecc] text-text-muted">
                {pendingReleaseWorkflows.length} IN QUEUE
              </span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5 font-sans">
              Every deposit release strictly mandates explicit human authorization by the AICTE Regulation Bureau.
            </p>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="p-8 text-center text-xs font-mono text-text-muted">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-accent-orange" />
            Loading real release workflow records from PostgreSQL database...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-[#fff0f2] border border-[#feb2b2] text-[#c53030] text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to load release records: {error}</span>
            </div>
            <button
              onClick={fetchWorkflowData}
              className="skeuo-btn px-2.5 py-1 text-xs font-mono rounded"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && pendingReleaseWorkflows.length === 0 && (
          <div className="p-10 rounded-xl skeuo-recessed text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#1b7943]/10 border border-[#1b7943]/20 flex items-center justify-center text-[#1b7943]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                No Active Release Requests Pending
              </h4>
              <p className="text-xs text-text-muted max-w-md mx-auto mt-1 leading-relaxed">
                All 10 institutional security deposit instruments under AICTE safe custody remain actively lien-marked. No pending discharge applications or course closure NOCs are currently awaiting authorization.
              </p>
            </div>
            <button
              onClick={() => setShowInitiateModal(true)}
              className="skeuo-btn px-4 py-2 text-xs font-mono text-text-primary rounded-lg hover:text-accent-orange"
            >
              Initiate Release for an Active FDR
            </button>
          </div>
        )}

        {/* Active Pending Releases List */}
        {!loading && !error && pendingReleaseWorkflows.length > 0 && (
          <div className="space-y-3">
            {pendingReleaseWorkflows.map((item) => {
              const matchedFdr = fdrRecords.find(f => f.id === item.fdrId);
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl skeuo-recessed-shallow border border-[#babecc]/70 hover:bg-panel transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#d1d9e6]/60">
                    <div className="flex items-center gap-2.5">
                      <span className="led-indicator led-amber" />
                      <span className="text-xs font-mono font-bold text-text-primary">
                        REQ #{item.id.slice(0, 8)}
                      </span>
                      <span className="text-xs font-mono text-text-muted">
                        FDR: <strong>{matchedFdr?.reference || item.fdrId}</strong>
                      </span>
                      <LifecycleBadge status="RELEASE_REQUESTED" />
                    </div>

                    <div className="text-xs font-mono text-text-muted">
                      Requested on: <strong>{formatDate(item.requestDate)}</strong> by {item.requestedBy}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-text-muted">Institution:</span>
                      <p className="font-bold text-text-primary">{matchedFdr?.institution || 'AICTE Affiliated Institute'}</p>
                      <p className="text-[10px] text-text-muted">{matchedFdr?.institutionCode}</p>
                    </div>

                    <div>
                      <span className="text-text-muted">Deposit Lien Amount:</span>
                      <p className="text-sm font-bold text-text-primary">
                        {matchedFdr ? formatINR(matchedFdr.depositAmount) : '—'}
                      </p>
                      <p className="text-[10px] text-text-muted">{matchedFdr?.bankName}</p>
                    </div>

                    <div>
                      <span className="text-text-muted">Sanction Order Ref:</span>
                      <p className="font-bold text-accent-orange">
                        {item.proposedChanges?.releaseOrderNumber || 'Sanction Order Pending'}
                      </p>
                      <p className="text-[10px] text-text-muted truncate">
                        Settlement: {item.proposedChanges?.settlementAccountDetails || 'Original Escrow Account'}
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-panel border border-[#babecc]/50 text-xs text-text-muted font-sans">
                    <strong>Administrative Justification:</strong> {item.reason}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    {matchedFdr && (
                      <button
                        onClick={() => onViewDetails(matchedFdr)}
                        className="skeuo-btn px-3 py-1.5 text-xs font-mono rounded-lg flex items-center gap-1.5 text-text-muted hover:text-text-primary"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Dossier</span>
                      </button>
                    )}

                    {/* Maker (Scrutiny Officer) Actions */}
                    {isScrutinyOfficer && (
                      <>
                        <button
                          onClick={() => {
                            setDecisionItem(item);
                            setDecisionType('REJECTED');
                            setDecisionNotes('');
                            setDecisionError(null);
                          }}
                          className="skeuo-btn px-3 py-1.5 text-xs font-mono rounded-lg flex items-center gap-1.5 text-[#ff4757] hover:bg-[#fff0f2]"
                        >
                          <FileX className="w-3.5 h-3.5" />
                          <span>Flag Discrepancy</span>
                        </button>

                        <button
                          onClick={() => {
                            setDecisionItem(item);
                            setDecisionType('APPROVED');
                            setDecisionNotes('');
                            setDecisionError(null);
                          }}
                          className="skeuo-btn px-4 py-1.5 text-xs font-mono rounded-lg shadow-sm flex items-center gap-1.5 bg-cyan-50 border border-cyan-400 text-cyan-800 hover:bg-cyan-100 font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-700" />
                          <span>Recommend Clearance (Maker)</span>
                        </button>
                      </>
                    )}

                    {/* Approving Authority (Bureau Chief) Actions */}
                    {isBureauChief && (
                      <>
                        <button
                          onClick={() => {
                            setDecisionItem(item);
                            setDecisionType('REJECTED');
                            setDecisionNotes('');
                            setDecisionError(null);
                          }}
                          className="skeuo-btn px-3 py-1.5 text-xs font-mono rounded-lg flex items-center gap-1.5 text-[#ff4757] hover:bg-[#fff0f2]"
                        >
                          <FileX className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => {
                            setDecisionItem(item);
                            setDecisionType('APPROVED');
                            setDecisionNotes('');
                            setDecisionError(null);
                          }}
                          className="skeuo-btn-accent px-4 py-1.5 text-xs font-mono rounded-lg shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Authorize Release (Checker)</span>
                        </button>
                      </>
                    )}

                    {/* External Stakeholders (College / Bank) View */}
                    {(isInstitutionalUser || isBankNode) && (
                      <span className="px-3 py-1 rounded-lg text-xs font-mono bg-chassis border border-[#d1d9e6] text-text-muted flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-accent-orange" />
                        <span>Awaiting AICTE Executive Committee Clearance</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Release Decided Log */}
      {decidedReleaseWorkflows.length > 0 && (
        <div className="skeuo-panel p-5 relative overflow-hidden space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted flex items-center gap-2 pb-2 border-b border-[#d1d9e6]">
            <span>Recent Completed Release Decisions</span>
          </h3>

          <div className="space-y-2">
            {decidedReleaseWorkflows.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl skeuo-recessed-shallow border border-[#babecc]/50 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="font-bold text-text-primary">FDR ID: {item.fdrId}</span>
                  <span className="text-text-muted mx-2">&bull;</span>
                  <span className={item.status === 'APPROVED' ? 'text-[#1b7943] font-bold' : 'text-[#ff4757] font-bold'}>
                    {item.status}
                  </span>
                  <p className="text-[11px] text-text-muted mt-0.5">Notes: {item.decisionNotes}</p>
                </div>
                <div className="text-right text-[10px] text-text-muted">
                  <span>{item.decidedBy}</span>
                  <span className="block">{item.decisionDate ? formatDate(item.decisionDate) : 'Completed'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Decision Modal */}
      {decisionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-[#2d3436]/50 backdrop-blur-sm"
            onClick={() => setDecisionItem(null)}
          />
          <div className="relative w-full max-w-lg skeuo-panel-elevated p-6 z-10 space-y-4 border-2 border-white/90 shadow-skeuo-modal">
            <div className="flex items-center justify-between pb-3 border-b border-[#d1d9e6]">
              <div className="flex items-center gap-2">
                <span className={`led-indicator ${decisionType === 'APPROVED' ? 'led-green' : 'led-red'}`} />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                  {decisionType === 'APPROVED' ? 'Authorize Deposit Release' : 'Reject Deposit Release'}
                </h3>
              </div>
              <button
                onClick={() => setDecisionItem(null)}
                className="skeuo-btn p-1.5 rounded-lg text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {decisionError && (
              <div className="p-3 rounded-lg bg-[#fff0f2] border border-[#feb2b2] text-[#c53030] text-xs font-mono">
                {decisionError}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div className="p-3 rounded-xl skeuo-recessed text-xs font-mono space-y-1">
                <div>FDR ID: <strong>{decisionItem.fdrId}</strong></div>
                <div>Request Ref: <strong>{decisionItem.id}</strong></div>
                <div>Sanction Order: <strong>{decisionItem.proposedChanges?.releaseOrderNumber || 'N/A'}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-text-muted uppercase mb-1">
                  Regulatory Decision Notes &amp; Audit Justification <span className="text-[#ff4757]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Enter formal justification, AICTE executive minute reference, and audit endorsement..."
                  className="w-full p-2.5 text-xs font-mono skeuo-input"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDecisionItem(null)}
                  className="skeuo-btn px-4 py-2 text-xs font-mono rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deciding}
                  className={`${decisionType === 'APPROVED' ? 'skeuo-btn-accent' : 'skeuo-btn text-[#ff4757] border-[#ff4757]/40'} px-5 py-2 text-xs font-mono rounded-lg shadow-md flex items-center gap-1.5`}
                >
                  {deciding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Confirm {decisionType === 'APPROVED' ? 'Approval' : 'Rejection'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Initiate Release Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-[#2d3436]/50 backdrop-blur-sm"
            onClick={() => setShowInitiateModal(false)}
          />
          <div className="relative w-full max-w-lg skeuo-panel-elevated p-6 z-10 space-y-4 border-2 border-white/90 shadow-skeuo-modal">
            <div className="flex items-center justify-between pb-3 border-b border-[#d1d9e6]">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#2ed573]" />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                  Initiate Deposit Release Application
                </h3>
              </div>
              <button
                onClick={() => setShowInitiateModal(false)}
                className="skeuo-btn p-1.5 rounded-lg text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {initiateError && (
              <div className="p-3 rounded-lg bg-[#fff0f2] border border-[#feb2b2] text-[#c53030] text-xs font-mono">
                {initiateError}
              </div>
            )}

            <form onSubmit={handleInitiateSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block font-bold text-text-muted uppercase mb-1">
                  Select Active FDR Instrument <span className="text-[#ff4757]">*</span>
                </label>
                <select
                  value={selectedFdrId}
                  onChange={(e) => setSelectedFdrId(e.target.value)}
                  className="w-full p-2.5 skeuo-input"
                  required
                >
                  <option value="">-- Choose active FDR from vault --</option>
                  {eligibleFdrsForRelease.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.reference} — {f.institution} ({formatINR(f.depositAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-text-muted uppercase mb-1">
                  Government / Bureau Sanction Order No <span className="text-[#ff4757]">*</span>
                </label>
                <input
                  type="text"
                  value={releaseOrderNo}
                  onChange={(e) => setReleaseOrderNo(e.target.value)}
                  placeholder="e.g. AICTE/REG/2026/NOC-9921"
                  className="w-full p-2.5 skeuo-input"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-text-muted uppercase mb-1">
                  Settlement Bank Account Particulars
                </label>
                <input
                  type="text"
                  value={settlementAccount}
                  onChange={(e) => setSettlementAccount(e.target.value)}
                  placeholder="e.g. Current A/C #00921004812, SBI Main Branch"
                  className="w-full p-2.5 skeuo-input"
                />
              </div>

              <div>
                <label className="block font-bold text-text-muted uppercase mb-1">
                  Statutory Release Justification <span className="text-[#ff4757]">*</span>
                </label>
                <textarea
                  rows={2}
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  placeholder="e.g. Approved institution course closure and fulfillment of tripartite bond obligations."
                  className="w-full p-2.5 skeuo-input font-sans"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInitiateModal(false)}
                  className="skeuo-btn px-4 py-2 text-xs font-mono rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={initiating}
                  className="skeuo-btn-accent px-5 py-2 text-xs font-mono rounded-lg shadow-md flex items-center gap-1.5"
                >
                  {initiating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Release Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

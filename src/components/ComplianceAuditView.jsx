import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sliders,
  FileCheck,
  ArrowRight,
  Info,
  Calendar,
  Landmark,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../data/sampleFdrData';

export function ComplianceAuditView({
  fdrId,
  initialReport = null,
  customDocData = null,
  onStatusUpdated
}) {
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(!initialReport);
  const [error, setError] = useState(null);
  const [expandedRules, setExpandedRules] = useState(new Set());
  const [showConfig, setShowConfig] = useState(false);

  // Configurable thresholds
  const [approachingDays, setApproachingDays] = useState(90);
  const [amountTolerance, setAmountTolerance] = useState(1.0);
  const [ocrThreshold, setOcrThreshold] = useState(75.0);

  const fetchReport = async () => {
    if (!fdrId) return;
    setLoading(true);
    setError(null);
    try {
      if (customDocData) {
        const res = await api.evaluateCustomCompliance({
          fdrId: fdrId,
          ocrExtractedFields: customDocData.extractedFields || customDocData,
          ocrConfidence: customDocData.overallConfidence || 90.0,
          config: {
            approachingMaturityDays: Number(approachingDays),
            amountTolerance: Number(amountTolerance),
            ocrConfidenceThreshold: Number(ocrThreshold)
          }
        });
        setReport(res);
        if (onStatusUpdated) onStatusUpdated(res);
      } else {
        const res = await api.getFdrComplianceReport(fdrId, {
          approachingMaturityDays: Number(approachingDays),
          amountTolerance: Number(amountTolerance),
          ocrConfidenceThreshold: Number(ocrThreshold)
        });
        setReport(res);
        if (onStatusUpdated) onStatusUpdated(res);
      }
    } catch (err) {
      console.error('Failed to load compliance report:', err);
      setError(err.message || 'Failed to evaluate compliance rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fdrId, customDocData]);

  const toggleRule = (ruleId) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#1b7943]" />
            <span>PASS</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#fff8e6] text-[#b36b00] border border-[#ffd166] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-[#b36b00]" />
            <span>WARNING</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#fff1f0] text-[#cf1322] border border-[#ffa39e] flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-[#cf1322]" />
            <span>FAIL</span>
          </span>
        );
      case 'NEEDS_REVIEW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#e6f7ff] text-[#096dd9] border border-[#91d5ff] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#096dd9]" />
            <span>NEEDS REVIEW</span>
          </span>
        );
    }
  };

  const getOverallStatusPill = (status) => {
    switch (status) {
      case 'COMPLIANT':
        return {
          label: 'FULLY COMPLIANT',
          bg: 'bg-[#eafaf1] text-[#1b7943] border-[#b7ebcd]',
          icon: ShieldCheck
        };
      case 'NON_COMPLIANT':
        return {
          label: 'NON-COMPLIANT',
          bg: 'bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]',
          icon: ShieldAlert
        };
      case 'ACTION_REQUIRED':
        return {
          label: 'ACTION REQUIRED',
          bg: 'bg-[#fff8e6] text-[#b36b00] border-[#ffd166]',
          icon: AlertTriangle
        };
      case 'UNDER_REVIEW':
      default:
        return {
          label: 'UNDER REVIEW',
          bg: 'bg-[#e6f7ff] text-[#096dd9] border-[#91d5ff]',
          icon: Clock
        };
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3 font-mono text-xs text-text-muted">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-accent-cyan" />
        <p>Evaluating 8 statutory compliance & discrepancy rules...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-4 rounded-xl bg-[#fff1f0] border border-[#ffa39e] text-[#cf1322] text-xs font-mono space-y-2">
        <div className="flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4" />
          <span>Compliance Evaluation Error</span>
        </div>
        <p>{error || 'Could not load compliance data.'}</p>
        <button
          onClick={fetchReport}
          className="px-3 py-1 bg-white border border-[#ffa39e] rounded text-[11px] font-bold hover:bg-[#fff1f0]"
        >
          Retry Audit
        </button>
      </div>
    );
  }

  const overall = getOverallStatusPill(report.overallStatus);
  const StatusIcon = overall.icon;

  return (
    <div className="space-y-5">
      
      {/* Top Compliance Executive Header */}
      <div className="p-4 rounded-xl skeuo-recessed border border-[#d1d9e6] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${overall.bg} shadow-sm`}>
              <StatusIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${overall.bg}`}>
                  {overall.label}
                </span>
                <span className="text-xs font-mono text-text-muted">
                  Instrument Ref: <strong className="text-text-primary">{report.reference}</strong>
                </span>
              </div>
              <p className="text-xs font-mono text-text-secondary mt-1">
                {report.summaryExplanation}
              </p>
            </div>
          </div>

          {/* Compliance Score Gauge */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-chassis border border-[#d1d9e6] self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] font-mono text-text-muted uppercase block">Compliance Score</span>
              <span className={`text-xl font-bold font-mono ${
                report.complianceScore >= 85 ? 'text-[#1b7943]' : report.complianceScore >= 60 ? 'text-[#b36b00]' : 'text-[#cf1322]'
              }`}>
                {report.complianceScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Rule Outcome Metrics Bar */}
        <div className="pt-2 border-t border-[#d1d9e6]/70 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-chassis flex items-center justify-between border border-[#d1d9e6]/60">
            <span className="text-text-muted text-[11px]">Rules Passed:</span>
            <span className="font-bold text-[#1b7943]">{report.passCount} / {report.totalRules}</span>
          </div>
          <div className="p-2 rounded bg-chassis flex items-center justify-between border border-[#d1d9e6]/60">
            <span className="text-text-muted text-[11px]">Failures:</span>
            <span className="font-bold text-[#cf1322]">{report.failCount}</span>
          </div>
          <div className="p-2 rounded bg-chassis flex items-center justify-between border border-[#d1d9e6]/60">
            <span className="text-text-muted text-[11px]">Warnings:</span>
            <span className="font-bold text-[#b36b00]">{report.warningCount}</span>
          </div>
          <div className="p-2 rounded bg-chassis flex items-center justify-between border border-[#d1d9e6]/60">
            <span className="text-text-muted text-[11px]">Needs Review:</span>
            <span className="font-bold text-[#096dd9]">{report.needsReviewCount}</span>
          </div>
        </div>

        {/* Recommended Action Callout */}
        <div className="p-3 rounded-lg bg-[#edf2f7] border border-[#cbd5e1] text-xs font-mono flex items-start gap-2.5">
          <ArrowRight className="w-4 h-4 text-accent-orange shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-text-primary uppercase text-[11px] block">
              Recommended Administrative Next Action:
            </span>
            <p className="text-text-secondary mt-0.5 leading-relaxed">
              {report.recommendedNextAction}
            </p>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Toggle Bar */}
      <div className="flex items-center justify-between text-xs font-mono px-1">
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="text-text-muted hover:text-text-primary flex items-center gap-1.5 underline decoration-dotted"
        >
          <Sliders className="w-3.5 h-3.5 text-accent-cyan" />
          <span>{showConfig ? 'Hide' : 'Configure'} Evaluation Parameters (Maturity Horizon, Tolerance)</span>
        </button>

        <button
          type="button"
          onClick={fetchReport}
          className="skeuo-btn px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1 text-text-muted hover:text-text-primary"
          title="Re-run compliance engine"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Re-evaluate</span>
        </button>
      </div>

      {showConfig && (
        <div className="p-3.5 rounded-xl bg-[#edf2f7] border border-[#cbd5e1] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div>
            <label className="block text-text-muted text-[11px] mb-1">
              Approaching Maturity Window (Days):
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={approachingDays}
              onChange={(e) => setApproachingDays(Number(e.target.value))}
              className="w-full px-2 py-1 rounded skeuo-input border border-[#babecc]"
            />
          </div>

          <div>
            <label className="block text-text-muted text-[11px] mb-1">
              Principal Amount Tolerance (INR):
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={amountTolerance}
              onChange={(e) => setAmountTolerance(Number(e.target.value))}
              className="w-full px-2 py-1 rounded skeuo-input border border-[#babecc]"
            />
          </div>

          <div>
            <label className="block text-text-muted text-[11px] mb-1">
              OCR Confidence Threshold (%):
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={ocrThreshold}
              onChange={(e) => setOcrThreshold(Number(e.target.value))}
              className="w-full px-2 py-1 rounded skeuo-input border border-[#babecc]"
            />
          </div>
        </div>
      )}

      {/* 8 Rule Checks List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
          <FileCheck className="w-4 h-4 text-accent-orange" />
          <span>Explainable Rule Audit Log ({report.checks.length} Regulatory Checks)</span>
        </h4>

        {report.checks.map((check) => {
          const isExpanded = expandedRules.has(check.ruleId);
          return (
            <div
              key={check.ruleId}
              className="rounded-xl skeuo-panel border border-[#d1d9e6] overflow-hidden text-xs font-mono transition-all"
            >
              <div
                onClick={() => toggleRule(check.ruleId)}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#edf2f7]/50 select-none"
              >
                <div className="flex items-center gap-2.5">
                  {getStatusBadge(check.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary">{check.title}</span>
                      <span className="text-[10px] text-text-muted">({check.ruleId})</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      {check.explanation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted">
                    {isExpanded ? 'Hide Evidence' : 'View Evidence'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </div>
              </div>

              {/* Evidence & Action Drawer */}
              {isExpanded && (
                <div className="p-3.5 bg-[#f0f4f8] border-t border-[#d1d9e6] space-y-2.5">
                  {/* Evidence KV block */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block mb-1">
                      Audited Evidence & Parameters:
                    </span>
                    <pre className="p-2.5 rounded bg-chassis border border-[#d1d9e6] text-[11px] text-text-primary overflow-x-auto leading-relaxed">
                      {JSON.stringify(check.evidence, null, 2)}
                    </pre>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-2.5 rounded bg-white border border-[#d1d9e6] text-[11px]">
                    <span className="font-bold text-text-primary block text-[10px] uppercase text-accent-orange">
                      Specific Recommended Action:
                    </span>
                    <p className="text-text-secondary mt-0.5">
                      {check.recommendedAction}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Statutory Disclaimer */}
      <div className="p-3 rounded-lg bg-[#fff8e6] border-l-4 border-l-[#d9534f] text-[11px] font-mono text-text-secondary space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-text-primary">
          <ShieldAlert className="w-3.5 h-3.5 text-[#d9534f]" />
          <span>Statutory Compliance Notice</span>
        </div>
        <p className="leading-relaxed">
          {report.disclaimer}
        </p>
      </div>

    </div>
  );
}
export default ComplianceAuditView;

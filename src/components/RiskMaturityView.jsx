import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  ArrowRight,
  Landmark,
  Scale
} from 'lucide-react';
import { PriorityBadge, MaturityBadge } from './StatusBadge';
import { formatINR, formatDate } from '../data/sampleFdrData';
import { api } from '../services/api';

export function RiskMaturityView({ fdrId, initialData = null }) {
  const [assessment, setAssessment] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  const fetchAssessment = async () => {
    if (!fdrId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFdrRiskAssessment(fdrId);
      setAssessment(data);
    } catch (err) {
      console.warn('Failed to fetch FDR risk assessment:', err);
      setError(err.message || 'Cannot retrieve risk analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [fdrId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-mono text-text-muted animate-pulse">
        <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-accent-orange" />
        Evaluating statutory risk factors and maturity horizon countdown...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-[#fff0f2] border border-[#feb2b2] text-[#c53030] text-xs font-mono flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Failed to evaluate risk priority: {error}</span>
        </div>
        <button
          onClick={fetchAssessment}
          className="skeuo-btn px-2.5 py-1 text-xs font-mono text-text-primary rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div className="space-y-4">
      {/* Top Banner: Priority & Maturity Window Summary */}
      <div className="p-4 rounded-xl skeuo-panel border-l-4 border-l-accent-orange flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={assessment.priority} score={assessment.priorityScore} />
            <MaturityBadge category={assessment.maturityCategory} daysRemaining={assessment.daysRemaining} />
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-panel border border-[#babecc] text-text-muted">
              SCORE: {assessment.priorityScore}/100
            </span>
          </div>
          <h3 className="text-sm font-bold text-text-primary mt-1">
            Statutory Risk Evaluation: {assessment.reference}
          </h3>
          <p className="text-xs text-text-muted">
            Evaluated as of {assessment.evaluatedAtDate}. Automated decision-support metric.
          </p>
        </div>

        <button
          onClick={fetchAssessment}
          className="skeuo-btn px-2.5 py-1.5 rounded-lg text-xs font-mono text-text-muted hover:text-text-primary flex items-center gap-1.5 self-start sm:self-center"
          title="Re-run Risk Assessment"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Evaluate</span>
        </button>
      </div>

      {/* Plain Language Explanation */}
      <div className="p-4 rounded-xl skeuo-recessed border border-[#d1d9e6] space-y-2">
        <h4 className="text-xs font-mono font-bold uppercase text-text-muted flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Policy Justification & Analysis</span>
        </h4>
        <p className="text-xs text-text-primary leading-relaxed">
          {assessment.explanation}
        </p>

        {/* Recommended Next Action */}
        <div className="mt-3 p-3 rounded-lg bg-panel border border-accent-orange/30 flex items-start gap-2.5">
          <ArrowRight className="w-4 h-4 text-accent-orange mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <strong className="text-text-primary font-bold">Recommended Bureau Action: </strong>
            <span className="text-text-muted">{assessment.recommendedAction}</span>
          </div>
        </div>
      </div>

      {/* Risk Factors Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-mono font-bold uppercase text-text-muted px-1 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-accent-orange" />
          <span>Identified Statutory Risk Factors ({assessment.riskFactors.length})</span>
        </h4>

        {assessment.riskFactors.length === 0 ? (
          <div className="p-4 rounded-xl skeuo-recessed text-center text-xs font-mono text-text-muted">
            <CheckCircle2 className="w-5 h-5 text-[#1b7943] mx-auto mb-1.5" />
            <span>No active statutory risk factors detected. Standard custody maintained.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {assessment.riskFactors.map((factor, i) => (
              <div
                key={i}
                className="p-3 rounded-xl skeuo-panel border border-[#d1d9e6] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={factor.severity} />
                    <span className="text-xs font-bold text-text-primary">
                      {factor.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted bg-[#e8edf4] px-1.5 py-0.5 rounded">
                    {factor.factorCode}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {factor.description}
                </p>

                {/* Evidence snippet */}
                {factor.evidence && Object.keys(factor.evidence).length > 0 && (
                  <div className="mt-1.5 p-2 rounded bg-chassis border border-[#d1d9e6] font-mono text-[10px] text-text-muted">
                    <span className="font-semibold text-text-primary">Evidence: </span>
                    {Object.entries(factor.evidence).map(([k, v]) => (
                      <span key={k} className="mr-3">
                        <strong className="text-text-primary">{k}:</strong> {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statutory Heuristic Guardrail Notice */}
      <div className="p-3 rounded-xl skeuo-recessed text-[11px] text-text-muted font-mono flex items-start gap-2">
        <Info className="w-4 h-4 text-accent-cyan flex-shrink-0 mt-0.5" />
        <span>
          <strong>STATUTORY NOTICE:</strong> Risk prioritization scores and maturity tracking are deterministic administrative heuristics designed to guide bureau officer attention. They do not constitute judicial findings of fraud or warranty of lien validity.
        </span>
      </div>
    </div>
  );
}

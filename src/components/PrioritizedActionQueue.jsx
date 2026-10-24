import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Scale,
  Calendar,
  Building,
  Landmark,
  ArrowRight,
  Info
} from 'lucide-react';
import { PriorityBadge, MaturityBadge, StatusBadge } from './StatusBadge';
import { formatINR, formatDate } from '../data/sampleFdrData';
import { api } from '../services/api';

export function PrioritizedActionQueue({
  records = [],
  onViewDetails,
  onNavigateToRepository
}) {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [maturityFilter, setMaturityFilter] = useState('ALL');
  const [complianceFilter, setComplianceFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRiskData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRiskSummary();
      setRiskData(data);
    } catch (err) {
      console.warn('Failed to load risk prioritization data:', err);
      setError(err.message || 'Cannot connect to Risk Prioritization API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, [records]);

  // Client-side filtering over prioritized queue
  const filteredQueue = useMemo(() => {
    if (!riskData || !Array.isArray(riskData.prioritizedQueue)) return [];
    return riskData.prioritizedQueue.filter((item) => {
      // Priority filter
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) {
        return false;
      }
      // Maturity filter
      if (maturityFilter !== 'ALL' && item.maturityCategory !== maturityFilter) {
        return false;
      }
      // Compliance filter
      if (complianceFilter !== 'ALL' && item.complianceStatus !== complianceFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = item.reference?.toLowerCase().includes(q);
        const matchesInst = item.institutionName?.toLowerCase().includes(q);
        const matchesCode = item.institutionCode?.toLowerCase().includes(q);
        const matchesBank = item.bankName?.toLowerCase().includes(q);
        return matchesRef || matchesInst || matchesCode || matchesBank;
      }
      return true;
    });
  }, [riskData, priorityFilter, maturityFilter, complianceFilter, searchQuery]);

  const handleInspect = (item) => {
    // Locate original record from parent records list or synthesize
    const match = records.find(r => r.id === item.fdrId || r.reference === item.reference);
    if (match) {
      onViewDetails(match);
    } else {
      // Fallback object matching RecordDetailsModal interface
      onViewDetails({
        id: item.fdrId,
        reference: item.reference,
        institution: item.institutionName,
        institutionCode: item.institutionCode,
        bankName: item.bankName,
        depositAmount: item.depositAmount,
        maturityDate: item.maturityDate,
        verificationStatus: item.verificationStatus,
        priority: item.priority
      });
    }
  };

  const hasActiveFilters = priorityFilter !== 'ALL' || maturityFilter !== 'ALL' || complianceFilter !== 'ALL' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setPriorityFilter('ALL');
    setMaturityFilter('ALL');
    setComplianceFilter('ALL');
    setSearchQuery('');
  };

  return (
    <div className="skeuo-panel p-5 relative overflow-hidden space-y-4">
      {/* Corner Hardware Screws */}
      <span className="screw-head absolute top-3 left-3 opacity-80" />
      <span className="screw-head absolute top-3 right-3 opacity-80" />
      <span className="screw-head absolute bottom-3 left-3 opacity-80" />
      <span className="screw-head absolute bottom-3 right-3 opacity-80" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#d1d9e6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="led-indicator led-red" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <span>Statutory Risk & Maturity Action Queue</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-orange/15 text-accent-orange font-bold">
                STEP 6 ACTIVE
              </span>
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5 font-sans">
            Deterministic, rule-based urgency ranking considering maturity horizons, statutory compliance violations, and document custody.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRiskData}
            disabled={loading}
            className="skeuo-btn px-2.5 py-1.5 rounded-lg text-xs font-mono text-text-muted hover:text-text-primary flex items-center gap-1.5"
            title="Refresh Risk Evaluation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Re-Assess</span>
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards (Priority & Maturity Horizon Breakdown) */}
      {riskData && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs font-mono">
          <button
            onClick={() => setPriorityFilter(priorityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              priorityFilter === 'CRITICAL'
                ? 'bg-[#fff0f2] border-[#feb2b2] shadow-[inset_1px_1px_3px_#feb2b2]'
                : 'skeuo-recessed hover:border-[#ff4757]/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#cf1322] font-semibold">
              <span>Critical</span>
              <span className="led-indicator led-red" />
            </div>
            <div className="text-lg font-bold text-text-primary mt-1">{riskData.criticalCount}</div>
            <div className="text-[10px] text-text-muted">Urgent Action</div>
          </button>

          <button
            onClick={() => setPriorityFilter(priorityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              priorityFilter === 'HIGH'
                ? 'bg-[#fff5eb] border-[#fbd38d] shadow-[inset_1px_1px_3px_#fbd38d]'
                : 'skeuo-recessed hover:border-[#ff6b35]/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#e65100] font-semibold">
              <span>High Risk</span>
              <span className="led-indicator led-amber" />
            </div>
            <div className="text-lg font-bold text-text-primary mt-1">{riskData.highCount}</div>
            <div className="text-[10px] text-text-muted">&le; 30d Window</div>
          </button>

          <button
            onClick={() => setPriorityFilter(priorityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              priorityFilter === 'MEDIUM'
                ? 'bg-[#fff8e6] border-[#ffd166] shadow-[inset_1px_1px_3px_#ffd166]'
                : 'skeuo-recessed hover:border-[#ffd166]/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#b36b00] font-semibold">
              <span>Medium Risk</span>
              <span className="led-indicator led-amber" />
            </div>
            <div className="text-lg font-bold text-text-primary mt-1">{riskData.mediumCount}</div>
            <div className="text-[10px] text-text-muted">Standard Queue</div>
          </button>

          <button
            onClick={() => setMaturityFilter(maturityFilter === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              maturityFilter === 'EXPIRED'
                ? 'bg-[#fff0f2] border-[#feb2b2] shadow-[inset_1px_1px_3px_#feb2b2]'
                : 'skeuo-recessed hover:border-[#cf1322]/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#cf1322] font-semibold">
              <span>Expired</span>
              <Clock className="w-3.5 h-3.5 text-[#cf1322]" />
            </div>
            <div className="text-lg font-bold text-text-primary mt-1">{riskData.expiredCount}</div>
            <div className="text-[10px] text-text-muted">&lt; 0 Days</div>
          </button>

          <button
            onClick={() => setMaturityFilter(maturityFilter === 'MATURING_30_DAYS' ? 'ALL' : 'MATURING_30_DAYS')}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              maturityFilter === 'MATURING_30_DAYS'
                ? 'bg-[#fff5eb] border-[#fbd38d] shadow-[inset_1px_1px_3px_#fbd38d]'
                : 'skeuo-recessed hover:border-[#ff6b35]/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#c05621] font-semibold">
              <span>Imminent</span>
              <Calendar className="w-3.5 h-3.5 text-[#c05621]" />
            </div>
            <div className="text-lg font-bold text-text-primary mt-1">{riskData.maturing30Count}</div>
            <div className="text-[10px] text-text-muted">0–30 Days</div>
          </button>

          <button
            onClick={() => setMaturityFilter(maturityFilter === 'BEYOND_90_DAYS' ? 'ALL' : 'BEYOND_90_DAYS')}
            className={`p-2.5 rounded-xl text-left border transition-all ${
              maturityFilter === 'BEYOND_90_DAYS'
                ? 'bg-[#eafaf1] border-[#b7ebcd] shadow-[inset_1px_1px_3px_#b7ebcd]'
                : 'skeuo-recessed hover:border-[#1b7943]/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-[#1b7943] font-semibold">
              <span>Safe Horizon</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1b7943]" />
            </div>
            <div className="text-lg font-bold text-text-primary mt-1">{riskData.beyond90Count}</div>
            <div className="text-[10px] text-text-muted">&gt; 90 Days</div>
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#e8edf4] p-3 rounded-xl border border-[#d1d9e6]">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action queue by ref, college, bank..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono skeuo-input placeholder:text-text-muted/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Priority Select */}
          <div className="flex items-center gap-1">
            <span className="text-text-muted text-[11px]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2 py-1 text-xs skeuo-input font-mono"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Maturity Select */}
          <div className="flex items-center gap-1">
            <span className="text-text-muted text-[11px]">Maturity:</span>
            <select
              value={maturityFilter}
              onChange={(e) => setMaturityFilter(e.target.value)}
              className="px-2 py-1 text-xs skeuo-input font-mono"
            >
              <option value="ALL">All Horizons</option>
              <option value="EXPIRED">Expired (&lt; 0d)</option>
              <option value="MATURING_30_DAYS">&le; 30 Days</option>
              <option value="MATURING_60_DAYS">31–60 Days</option>
              <option value="MATURING_90_DAYS">61–90 Days</option>
              <option value="BEYOND_90_DAYS">&gt; 90 Days</option>
            </select>
          </div>

          {/* Compliance Select */}
          <div className="flex items-center gap-1">
            <span className="text-text-muted text-[11px]">Compliance:</span>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="px-2 py-1 text-xs skeuo-input font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLIANT">Compliant</option>
              <option value="ACTION_REQUIRED">Action Required</option>
              <option value="NON_COMPLIANT">Non-Compliant</option>
              <option value="UNDER_REVIEW">Under Review</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2 py-1 text-xs skeuo-btn text-accent-orange font-semibold rounded"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center text-text-muted font-mono text-xs animate-pulse">
          Evaluating statutory risk rules and maturity countdowns...
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-[#fff0f2] border border-[#feb2b2] text-[#c53030] text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Risk Prioritization service unavailable: {error}</span>
          </div>
          <button
            onClick={fetchRiskData}
            className="skeuo-btn px-2.5 py-1 rounded text-xs font-mono text-text-primary"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredQueue.length === 0 && (
        <div className="p-8 text-center text-text-muted font-mono text-xs skeuo-recessed rounded-xl">
          <CheckCircle2 className="w-8 h-8 text-[#1b7943] mx-auto mb-2 opacity-80" />
          <p className="font-semibold text-text-primary">No matching instruments in this action filter</p>
          <p className="text-[11px] mt-0.5">All instruments meet current threshold criteria or no records matched.</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-3 skeuo-btn px-3 py-1 text-xs font-mono text-accent-orange rounded"
            >
              Clear Active Filters
            </button>
          )}
        </div>
      )}

      {/* Action Queue List */}
      {!loading && !error && filteredQueue.length > 0 && (
        <div className="space-y-3">
          {filteredQueue.map((item, idx) => (
            <div
              key={item.fdrId}
              className={`p-4 rounded-xl border transition-all ${
                item.priority === 'CRITICAL'
                  ? 'bg-[#fffbfb] border-[#ffa39e] shadow-[0_2px_8px_rgba(207,19,34,0.06)]'
                  : item.priority === 'HIGH'
                  ? 'bg-[#fffdfa] border-[#ffd591]'
                  : 'skeuo-panel'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left: Badges + Identifiers */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-text-muted bg-[#e8edf4] px-1.5 py-0.5 rounded border border-[#d1d9e6]">
                      #{idx + 1}
                    </span>
                    <PriorityBadge priority={item.priority} score={item.priorityScore} />
                    <MaturityBadge category={item.maturityCategory} daysRemaining={item.daysRemaining} />
                    {item.complianceStatus && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        item.complianceStatus === 'COMPLIANT'
                          ? 'bg-[#eafaf1] text-[#1b7943] border-[#b7ebcd]'
                          : item.complianceStatus === 'NON_COMPLIANT'
                          ? 'bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]'
                          : item.complianceStatus === 'ACTION_REQUIRED'
                          ? 'bg-[#fff8e6] text-[#b36b00] border-[#ffd166]'
                          : 'bg-[#e6f7ff] text-[#096dd9] border-[#91d5ff]'
                      }`}>
                        {item.complianceScore}% Compliant
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold text-text-primary">
                      {item.reference}
                    </span>
                  </div>

                  {/* College + Bank info */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                    <span className="font-semibold text-text-primary flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-text-muted" />
                      {item.institutionName} ({item.institutionCode})
                    </span>
                    <span className="text-text-muted/60">•</span>
                    <span className="flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-text-muted" />
                      {item.bankName}
                    </span>
                    <span className="text-text-muted/60">•</span>
                    <span className="font-bold text-accent-orange font-mono">
                      {formatINR(item.depositAmount, true)}
                    </span>
                  </div>

                  {/* Plain Language Explanation */}
                  <p className="text-xs text-text-primary leading-relaxed pt-1">
                    {item.explanation}
                  </p>

                  {/* Recommended Next Action */}
                  <div className="p-2 rounded-lg bg-[#f0f4f9] border-l-2 border-l-accent-orange text-xs text-text-primary flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-accent-orange mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="font-semibold text-text-primary">Recommended Action: </strong>
                      <span>{item.recommendedAction}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Action Trigger */}
                <div className="flex lg:flex-col items-center justify-end gap-2 flex-shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() => handleInspect(item)}
                    className="skeuo-btn px-3 py-2 rounded-xl text-xs font-mono font-bold text-text-primary hover:text-accent-orange flex items-center gap-1.5 shadow-sm"
                    title="Inspect Full FDR Dossier"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statutory Heuristic Guardrail Notice */}
      <div className="p-2.5 rounded-xl skeuo-recessed text-[11px] text-text-muted flex items-center gap-2 font-mono">
        <Info className="w-4 h-4 text-accent-cyan flex-shrink-0" />
        <span>
          <strong>DECISION-SUPPORT NOTICE:</strong> Statutory risk priorities and maturity countdowns are rule-based policy indicators. They do not constitute legal determinations of fraud or guarantee bank lien discharge.
        </span>
      </div>
    </div>
  );
}

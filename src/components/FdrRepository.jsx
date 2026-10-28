import React, { useState, useMemo, useEffect } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Landmark,
  Calendar,
  AlertCircle,
  Eye,
  Edit3,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  X,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
  Scale,
  ShieldAlert,
  AlertTriangle,
  Cpu
} from 'lucide-react';
import { StatusBadge, PriorityBadge, MaturityBadge, LifecycleBadge, VerificationSourceBadge } from './StatusBadge';
import { formatINR, formatDate } from '../data/sampleFdrData';
import { exportFdrsToCsv } from '../utils/exportUtils';
import { api } from '../services/api';

export function FdrRepository({
  fdrRecords = [],
  institutions = [],
  onAddFdr,
  onUpdateFdr,
  onDeleteFdr,
  onViewDetails,
  onOpenAddModal = false,
  onCloseAddModal,
  onNavigateToOcr,
  externalSearchTerm = ''
}) {
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [lifecycleFilter, setLifecycleFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [maturityWindowFilter, setMaturityWindowFilter] = useState('All');
  const [complianceFilter, setComplianceFilter] = useState('All');
  const [selectedInstitution, setSelectedInstitution] = useState('All');
  const [selectedBank, setSelectedBank] = useState('All');
  const [maturityStart, setMaturityStart] = useState('');
  const [maturityEnd, setMaturityEnd] = useState('');
  const [sortField, setSortField] = useState('maturityDate');
  const [sortDirection, setSortDirection] = useState('asc');

  // Sync external search term from Header
  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(onOpenAddModal);
  const [editingRecord, setEditingRecord] = useState(null);
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(true);
  const [complianceError, setComplianceError] = useState(false);
  const [riskSummary, setRiskSummary] = useState(null);
  const [riskLoading, setRiskLoading] = useState(true);

  React.useEffect(() => {
    let isMounted = true;
    setComplianceLoading(true);
    setComplianceError(false);
    setRiskLoading(true);

    api.getComplianceSummary()
      .then(data => {
        if (isMounted) {
          setComplianceSummary(data);
          setComplianceLoading(false);
        }
      })
      .catch(err => {
        console.warn('Compliance summary load error:', err);
        if (isMounted) {
          setComplianceError(true);
          setComplianceLoading(false);
        }
      });

    api.getRiskSummary()
      .then(data => {
        if (isMounted) {
          setRiskSummary(data);
          setRiskLoading(false);
        }
      })
      .catch(err => {
        console.warn('Risk summary load error:', err);
        if (isMounted) {
          setRiskLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [fdrRecords]);

  // Sync external add modal trigger if passed
  React.useEffect(() => {
    if (onOpenAddModal) {
      setShowAddModal(true);
    }
  }, [onOpenAddModal]);

  // Unique Banks list for filter dropdown
  const availableBanks = useMemo(() => {
    const set = new Set(fdrRecords.map(r => r.bankName).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [fdrRecords]);

  // Unique Institutions list for filter dropdown
  const availableInstitutions = useMemo(() => {
    return ['All', ...institutions.map(i => i.name).sort()];
  }, [institutions]);

  // Map risk assessments by fdrId
  const riskMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(riskSummary?.prioritizedQueue)) {
      riskSummary.prioritizedQueue.forEach(item => {
        map.set(item.fdrId, item);
      });
    }
    return map;
  }, [riskSummary]);

  // Filtered and sorted FDRs
  const filteredRecords = useMemo(() => {
    return fdrRecords
      .filter((item) => {
        // Status filter
        if (statusFilter !== 'All' && item.verificationStatus !== statusFilter) {
          return false;
        }

        // Priority filter (Step 6)
        if (priorityFilter !== 'All') {
          const r = riskMap.get(item.id);
          const p = r?.priority || item.priority?.toUpperCase() || 'STANDARD';
          if (p !== priorityFilter.toUpperCase()) return false;
        }

        // Maturity window filter (Step 6)
        if (maturityWindowFilter !== 'All') {
          const r = riskMap.get(item.id);
          if (r && r.maturityCategory !== maturityWindowFilter) return false;
        }

        // Compliance filter (Step 6)
        if (complianceFilter !== 'All') {
          const r = riskMap.get(item.id);
          if (r && r.complianceStatus !== complianceFilter) return false;
        }

        // Lifecycle state filter (Step 7)
        if (lifecycleFilter !== 'All') {
          const lc = (item.lifecycleStatus || 'ACTIVE').toUpperCase();
          if (lc !== lifecycleFilter.toUpperCase()) return false;
        }

        // Institution filter
        if (selectedInstitution !== 'All') {
          const matchesName = item.institution?.toLowerCase() === selectedInstitution.toLowerCase();
          const matchesCode = institutions.find(i => i.name === selectedInstitution)?.code === item.institutionCode;
          if (!matchesName && !matchesCode) return false;
        }

        // Bank filter
        if (selectedBank !== 'All' && item.bankName !== selectedBank) {
          return false;
        }

        // Maturity date range
        if (maturityStart) {
          if (!item.maturityDate || new Date(item.maturityDate) < new Date(maturityStart)) {
            return false;
          }
        }
        if (maturityEnd) {
          if (!item.maturityDate || new Date(item.maturityDate) > new Date(maturityEnd)) {
            return false;
          }
        }

        // Text search (reference, institution, code, bank, certificate number, ifsc)
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          const matchesRef = item.reference?.toLowerCase().includes(q);
          const matchesInst = item.institution?.toLowerCase().includes(q);
          const matchesCode = item.institutionCode?.toLowerCase().includes(q);
          const matchesBank = item.bankName?.toLowerCase().includes(q);
          const matchesCert = item.certificateNo?.toLowerCase().includes(q);
          const matchesIfsc = item.ifsc?.toLowerCase().includes(q);
          return matchesRef || matchesInst || matchesCode || matchesBank || matchesCert || matchesIfsc;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'depositAmount') {
          const valA = Number(a.depositAmount) || 0;
          const valB = Number(b.depositAmount) || 0;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        if (sortField === 'maturityDate') {
          const dateA = a.maturityDate ? new Date(a.maturityDate).getTime() : 0;
          const dateB = b.maturityDate ? new Date(b.maturityDate).getTime() : 0;
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (sortField === 'reference') {
          const res = (a.reference || '').localeCompare(b.reference || '');
          return sortDirection === 'asc' ? res : -res;
        }

        if (sortField === 'institution') {
          const res = (a.institution || '').localeCompare(b.institution || '');
          return sortDirection === 'asc' ? res : -res;
        }

        return 0;
      });
  }, [
    fdrRecords,
    institutions,
    searchTerm,
    statusFilter,
    lifecycleFilter,
    priorityFilter,
    maturityWindowFilter,
    complianceFilter,
    selectedInstitution,
    selectedBank,
    maturityStart,
    maturityEnd,
    sortField,
    sortDirection,
    riskMap
  ]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setLifecycleFilter('All');
    setPriorityFilter('All');
    setMaturityWindowFilter('All');
    setComplianceFilter('All');
    setSelectedInstitution('All');
    setSelectedBank('All');
    setMaturityStart('');
    setMaturityEnd('');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'All' ||
    lifecycleFilter !== 'All' ||
    priorityFilter !== 'All' ||
    maturityWindowFilter !== 'All' ||
    complianceFilter !== 'All' ||
    selectedInstitution !== 'All' ||
    selectedBank !== 'All' ||
    maturityStart !== '' ||
    maturityEnd !== '';

  const totalVaultCorpus = useMemo(() => {
    return fdrRecords.reduce((sum, r) => sum + (Number(r.depositAmount) || 0), 0);
  }, [fdrRecords]);

  const verifiedCount = fdrRecords.filter(r => r.verificationStatus === 'Verified').length;
  const pendingCount = fdrRecords.filter(r => r.verificationStatus === 'Pending').length;
  const alertCount = fdrRecords.filter(r => r.verificationStatus === 'Discrepancy' || r.verificationStatus === 'Expiring Soon').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Repository Telemetry */}
      <div className="p-5 rounded-xl skeuo-panel border-l-4 border-l-accent-orange relative overflow-hidden">
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#d1d9e6] text-text-muted border border-[#babecc]">
                CENTRAL DEPOSIT REPOSITORY
              </span>
              <span className="text-xs font-mono text-text-muted">
                Physical & Electronic Vault Tier-2 Registry
              </span>
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              FDR Repository
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Comprehensive inventory of tripartite fixed deposit receipts under AICTE Regulation Bureau lien custody.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportFdrsToCsv(filteredRecords, 'AICTE_Vaulted_FDR_Registry.csv')}
              className="skeuo-panel px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 hover:border-accent-orange text-text-primary shadow-sm hover:text-accent-orange transition-colors"
              title="Export filtered FDR records to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-accent-orange" />
              <span>Export CSV</span>
            </button>
            {onNavigateToOcr && (
              <button
                onClick={onNavigateToOcr}
                className="skeuo-panel px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 hover:border-accent-cyan text-text-primary shadow-sm hover:text-accent-cyan transition-colors"
                title="Intake physical receipt scan via OCR"
              >
                <Cpu className="w-4 h-4 text-accent-cyan" />
                <span>Upload & OCR</span>
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="skeuo-btn-accent px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New FDR</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Readout Pills */}
        <div className="mt-4 pt-3 border-t border-[#d1d9e6]/70 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
            <span className="text-text-muted text-[11px]">Vaulted FDRs</span>
            <span className="font-bold text-text-primary text-sm">{fdrRecords.length}</span>
          </div>
          <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
            <span className="text-text-muted text-[11px]">Total Corpus</span>
            <span className="font-bold text-accent-orange text-sm">{formatINR(totalVaultCorpus, true)}</span>
          </div>
          <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
            <span className="text-text-muted text-[11px]">Verified Lien</span>
            <span className="font-bold text-[#1b7943] text-sm">{verifiedCount}</span>
          </div>
          <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
            <span className="text-text-muted text-[11px]">Pending / Alerts</span>
            <span className="font-bold text-[#b7791f] text-sm">{pendingCount + alertCount}</span>
          </div>
          <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between col-span-2 sm:col-span-1">
            <span className="text-text-muted text-[11px]">Avg Compliance</span>
            <span className="font-bold text-accent-cyan text-sm">
              {complianceLoading
                ? 'Evaluating...'
                : complianceError
                ? 'Unavailable'
                : complianceSummary?.averageComplianceScore != null
                ? `${complianceSummary.averageComplianceScore}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="skeuo-panel p-5 relative overflow-hidden">
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />
        <span className="screw-head absolute bottom-3 left-3 opacity-80" />
        <span className="screw-head absolute bottom-3 right-3 opacity-80" />

        {/* Filter and Search Container */}
        <div className="space-y-3 bg-[#e8edf4] p-3.5 rounded-xl border border-[#d1d9e6]">
          
          {/* Row 1: Search + Status Filter Pills */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by FDR ref, institution, code, bank, cert no..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono skeuo-input placeholder:text-text-muted/60"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {['All', 'Verified', 'Pending', 'Discrepancy', 'Expiring Soon'].map((st) => {
                const isSelected = statusFilter === st;
                const count = st === 'All'
                  ? fdrRecords.length
                  : fdrRecords.filter(r => r.verificationStatus === st).length;

                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "skeuo-recessed text-text-primary font-bold border border-accent-orange/50 shadow-[inset_2px_2px_4px_#babecc]"
                        : "skeuo-btn text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span>{st}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-accent-orange text-white" : "bg-[#d1d9e6] text-text-muted"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Secondary Dropdown Filters (Institution, Bank, Date Range) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#d1d9e6]/80 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              {/* Institution Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-text-muted hidden sm:inline">Institution:</span>
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg max-w-[170px] truncate"
                >
                  {availableInstitutions.map((inst) => (
                    <option key={inst} value={inst}>{inst === 'All' ? 'All Institutions' : inst}</option>
                  ))}
                </select>
              </div>

              {/* Bank Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-text-muted hidden sm:inline">Bank:</span>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg max-w-[160px] truncate"
                >
                  {availableBanks.map((b) => (
                    <option key={b} value={b}>{b === 'All' ? 'All Banks' : b}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter (Step 6) */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-text-muted hidden sm:inline">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
                >
                  <option value="All">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Maturity Window Filter (Step 6) */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-text-muted hidden sm:inline">Maturity Window:</span>
                <select
                  value={maturityWindowFilter}
                  onChange={(e) => setMaturityWindowFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
                >
                  <option value="All">All Horizons</option>
                  <option value="EXPIRED">Expired (&lt; 0d)</option>
                  <option value="MATURING_30_DAYS">&le; 30 Days</option>
                  <option value="MATURING_60_DAYS">31–60 Days</option>
                  <option value="MATURING_90_DAYS">61–90 Days</option>
                  <option value="BEYOND_90_DAYS">&gt; 90 Days</option>
                </select>
              </div>

              {/* Compliance Filter (Step 6) */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-text-muted hidden sm:inline">Compliance:</span>
                <select
                  value={complianceFilter}
                  onChange={(e) => setComplianceFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
                >
                  <option value="All">All Statuses</option>
                  <option value="COMPLIANT">Compliant</option>
                  <option value="ACTION_REQUIRED">Action Required</option>
                  <option value="NON_COMPLIANT">Non-Compliant</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                </select>
              </div>

              {/* Lifecycle State Filter (Step 7) */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-text-muted hidden sm:inline">Lifecycle:</span>
                <select
                  value={lifecycleFilter}
                  onChange={(e) => setLifecycleFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
                >
                  <option value="All">All Lifecycles</option>
                  <option value="ACTIVE">Active</option>
                  <option value="RENEWAL_PENDING">Renewal Pending</option>
                  <option value="REPLACEMENT_PENDING">Replacement Pending</option>
                  <option value="RELEASE_REQUESTED">Release Requested</option>
                  <option value="RELEASED">Released / Closed</option>
                </select>
              </div>

              {/* Maturity Date Range */}
              <div className="flex items-center gap-1.5 bg-panel px-2.5 py-1 rounded-lg border border-[#d1d9e6]">
                <span className="text-[10px] text-text-muted uppercase">Maturity:</span>
                <input
                  type="date"
                  value={maturityStart}
                  onChange={(e) => setMaturityStart(e.target.value)}
                  className="bg-transparent text-[11px] font-mono text-text-primary outline-none"
                  title="Maturity Range Start"
                />
                <span className="text-text-muted text-[10px]">to</span>
                <input
                  type="date"
                  value={maturityEnd}
                  onChange={(e) => setMaturityEnd(e.target.value)}
                  className="bg-transparent text-[11px] font-mono text-text-primary outline-none"
                  title="Maturity Range End"
                />
              </div>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="skeuo-btn px-2.5 py-1 text-[11px] font-mono text-accent hover:bg-accent/10 rounded"
              >
                Reset Filters
              </button>
            )}
          </div>

        </div>

        {/* Table Readout Header */}
        <div className="mt-3 flex items-center justify-between text-xs font-mono text-text-muted px-1">
          <span>
            Showing <strong className="text-text-primary">{filteredRecords.length}</strong> of {fdrRecords.length} deposit instruments
          </span>
          <span className="text-[11px]">
            Lien Endorsement: Under Tripartite Custody
          </span>
        </div>

        {/* Repository Records Table */}
        <div className="mt-3 overflow-x-auto rounded-xl border border-[#d1d9e6] bg-panel">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#e4ebf5] border-b border-[#d1d9e6] text-text-muted font-mono uppercase text-[11px] tracking-wider select-none">
                <th
                  onClick={() => handleSort('reference')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-text-primary"
                >
                  <div className="flex items-center gap-1.5">
                    <span>FDR Reference</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('institution')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-text-primary"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Institution</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Bank & Branch</th>
                <th
                  onClick={() => handleSort('depositAmount')}
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-text-primary"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Deposit Amount</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Issue Date</th>
                <th
                  onClick={() => handleSort('maturityDate')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-text-primary"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Maturity Date</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Verification</th>
                <th className="py-3 px-4 font-semibold">Compliance Sentry</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#d1d9e6]/70 font-mono">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#f8fafd] transition-colors group"
                  >
                    {/* Reference */}
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => onViewDetails(item)}
                        className="font-bold text-text-primary hover:text-accent-orange cursor-pointer"
                      >
                        {item.reference}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        Cert: {item.certificateNo || '—'}
                      </div>
                    </td>

                    {/* Institution */}
                    <td className="py-3.5 px-4 font-sans max-w-xs">
                      <div className="font-semibold text-text-primary group-hover:text-accent-orange transition-colors">
                        {item.institution}
                      </div>
                      <div className="text-[11px] font-mono text-accent-orange mt-0.5 font-bold">
                        {item.institutionCode}
                      </div>
                    </td>

                    {/* Bank & Branch */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-medium text-text-primary">{item.bankName}</div>
                      <div className="text-[10px] font-mono text-text-muted mt-0.5">
                        {item.branch ? `${item.branch} ` : ''}{item.ifsc ? `(${item.ifsc})` : ''}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-sm text-text-primary">
                        {formatINR(item.depositAmount)}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        Int: {item.interestRate || 'N/A'}
                      </div>
                    </td>

                    {/* Issue Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-text-muted">{formatDate(item.issueDate)}</div>
                    </td>

                    {/* Maturity Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-text-primary">
                        {formatDate(item.maturityDate)}
                      </div>
                      {(() => {
                        const rItem = riskMap.get(item.id);
                        if (rItem) {
                          return (
                            <div className="mt-1">
                              <MaturityBadge category={rItem.maturityCategory} daysRemaining={rItem.daysRemaining} />
                            </div>
                          );
                        }
                        if (item.verificationStatus === 'Expiring Soon') {
                          return (
                            <div className="text-[9px] font-mono text-[#ff6b35] font-bold mt-0.5">
                              Expiring Soon
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>

                    {/* Verification & Lifecycle Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <StatusBadge status={item.verificationStatus} />
                        <div>
                          <VerificationSourceBadge status={item.verificationStatus} />
                        </div>
                        {item.lifecycleStatus && item.lifecycleStatus !== 'ACTIVE' && (
                          <div>
                            <LifecycleBadge status={item.lifecycleStatus} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Compliance Sentry Audit */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {(() => {
                        if (complianceLoading) {
                          return <span className="text-[10px] text-text-muted font-mono animate-pulse">Evaluating...</span>;
                        }
                        if (complianceError || !complianceSummary) {
                          return <span className="text-[10px] text-text-muted font-mono" title="Compliance audit currently unavailable">—</span>;
                        }
                        const compItem = Array.isArray(complianceSummary?.instruments)
                          ? complianceSummary.instruments.find(c => c.fdrId === item.id)
                          : null;
                        if (!compItem) return <span className="text-[10px] text-text-muted font-mono">—</span>;
                        return (
                          <div
                            onClick={() => onViewDetails(item)}
                            className="cursor-pointer inline-flex items-center"
                            title={compItem.primaryIssue || 'All 8 compliance rules passed. Click to view explainable audit.'}
                          >
                            {compItem.overallStatus === 'COMPLIANT' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd] inline-flex items-center gap-1 hover:border-[#1b7943]">
                                <CheckCircle2 className="w-3 h-3 text-[#1b7943]" />
                                <span>{compItem.complianceScore}% Compliant</span>
                              </span>
                            )}
                            {compItem.overallStatus === 'ACTION_REQUIRED' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fff8e6] text-[#b36b00] border border-[#ffd166] inline-flex items-center gap-1 hover:border-[#b36b00]">
                                <AlertTriangle className="w-3 h-3 text-[#b36b00]" />
                                <span>Action Req ({compItem.warningCount})</span>
                              </span>
                            )}
                            {compItem.overallStatus === 'NON_COMPLIANT' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fff1f0] text-[#cf1322] border border-[#ffa39e] inline-flex items-center gap-1 hover:border-[#cf1322]">
                                <AlertCircle className="w-3 h-3 text-[#cf1322]" />
                                <span>Non-Compliant ({compItem.failCount})</span>
                              </span>
                            )}
                            {(compItem.overallStatus === 'UNDER_REVIEW' || !['COMPLIANT', 'ACTION_REQUIRED', 'NON_COMPLIANT'].includes(compItem.overallStatus)) && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#e6f7ff] text-[#096dd9] border border-[#91d5ff] inline-flex items-center gap-1 hover:border-[#096dd9]">
                                <Clock className="w-3 h-3 text-[#096dd9]" />
                                <span>{compItem.overallStatus === 'UNDER_REVIEW' ? 'Under Review' : compItem.overallStatus || 'Under Review'}</span>
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {(() => {
                        const rItem = riskMap.get(item.id);
                        return (
                          <PriorityBadge
                            priority={rItem?.priority || item.priority || 'Standard'}
                            score={rItem?.priorityScore}
                          />
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewDetails(item)}
                          className="skeuo-btn p-1.5 rounded-lg text-text-muted hover:text-accent-orange"
                          title="View Official Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setEditingRecord(item)}
                          className="skeuo-btn p-1.5 rounded-lg text-text-muted hover:text-text-primary"
                          title="Edit FDR Record"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty State */
                <tr>
                  <td colSpan={10} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto p-6 rounded-2xl skeuo-recessed text-text-muted">
                      <AlertCircle className="w-10 h-10 text-accent-orange mx-auto mb-3" />
                      <h3 className="text-sm font-bold text-text-primary font-sans">
                        No Fixed Deposit Receipts Found
                      </h3>
                      <p className="text-xs font-mono mt-1 leading-relaxed">
                        No vaulted FDR instruments match your current search query or filter parameters.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-4 skeuo-btn px-3 py-1.5 rounded-lg text-xs font-mono text-accent-orange font-semibold"
                        >
                          Reset All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono text-text-muted">
          <span>AICTE Security Deposit Vault Protocol Ref #8921-2026</span>
          <span className="flex items-center gap-1.5">
            <span className="led-indicator led-green" />
            <span>Vault Synchronization Active</span>
          </span>
        </div>
      </div>

      {/* Add FDR Modal */}
      {showAddModal && (
        <AddFdrModal
          institutions={institutions}
          existingFdrs={fdrRecords}
          onClose={() => {
            setShowAddModal(false);
            if (onCloseAddModal) onCloseAddModal();
          }}
          onSave={(newRecord) => {
            onAddFdr(newRecord);
            setShowAddModal(false);
            if (onCloseAddModal) onCloseAddModal();
          }}
        />
      )}

      {/* Edit FDR Modal */}
      {editingRecord && (
        <EditFdrModal
          fdr={editingRecord}
          institutions={institutions}
          existingFdrs={fdrRecords}
          onClose={() => setEditingRecord(null)}
          onSave={(updatedRecord) => {
            onUpdateFdr(updatedRecord);
            setEditingRecord(null);
          }}
        />
      )}

    </div>
  );
}

/**
 * Add FDR Modal Form with Validation
 */
function AddFdrModal({ institutions = [], existingFdrs = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    reference: '',
    institutionCode: institutions[0]?.code || '',
    bankName: 'State Bank of India',
    branch: '',
    ifsc: '',
    certificateNo: '',
    depositAmount: '',
    interestRate: '7.10%',
    issueDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    verificationStatus: 'Pending', // Defaults to Pending as mandated
    priority: 'Standard',
    jointLienHolder: '',
    discrepancyNote: ''
  });

  const [errors, setErrors] = useState({});

  // Auto-fill joint lien holder when institution changes
  const handleInstitutionChange = (code) => {
    const selectedInst = institutions.find(i => i.code === code);
    setFormData(prev => ({
      ...prev,
      institutionCode: code,
      jointLienHolder: selectedInst
        ? `Member Secretary AICTE & Principal ${selectedInst.code}`
        : prev.jointLienHolder
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.reference.trim()) {
      errs.reference = 'FDR reference number is required.';
    } else {
      const duplicate = existingFdrs.some(
        f => f.reference?.toLowerCase() === formData.reference.trim().toLowerCase()
      );
      if (duplicate) errs.reference = 'Reference number already exists in repository.';
    }

    if (!formData.institutionCode) {
      errs.institutionCode = 'Please select an associated institution.';
    }

    if (!formData.bankName.trim()) {
      errs.bankName = 'Bank name is required.';
    }

    if (!formData.branch.trim()) {
      errs.branch = 'Bank branch location is required.';
    }

    if (!formData.ifsc.trim()) {
      errs.ifsc = 'Bank IFSC code is required.';
    } else {
      const ifscClean = formData.ifsc.trim().toUpperCase();
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscClean)) {
        errs.ifsc = 'IFSC must be 11 characters (e.g. SBIN0001823: 4 letters, 0, 6 alphanum).';
      }
    }

    const amountNum = Number(formData.depositAmount);
    if (!formData.depositAmount || isNaN(amountNum) || amountNum <= 0) {
      errs.depositAmount = 'Deposit amount must be a valid number greater than 0.';
    }

    if (!formData.issueDate) {
      errs.issueDate = 'Issue date is required.';
    }

    if (!formData.maturityDate) {
      errs.maturityDate = 'Maturity date is required.';
    } else if (formData.issueDate && new Date(formData.maturityDate) <= new Date(formData.issueDate)) {
      errs.maturityDate = 'Maturity date must be later than the issue date.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedInst = institutions.find(i => i.code === formData.institutionCode);

    const newRecord = {
      ...formData,
      id: `FDR-${Date.now()}`,
      reference: formData.reference.trim().toUpperCase(),
      branch: formData.branch.trim(),
      ifsc: formData.ifsc.trim().toUpperCase(),
      institution: selectedInst ? selectedInst.name : formData.institutionCode,
      institutionCode: formData.institutionCode,
      depositAmount: Number(formData.depositAmount),
      currency: 'INR',
      state: selectedInst ? selectedInst.state : 'Maharashtra',
      region: selectedInst ? `${selectedInst.state} Region` : 'AICTE HQ',
      trust: selectedInst ? selectedInst.trust : '',
      category: selectedInst ? selectedInst.type : 'Engineering & Technology',
      ocrConfidence: 95.0,
      physicalLocation: 'Intake Vault / Staging Tray 01',
      lastAudited: new Date().toISOString().split('T')[0],
      lienStatus: 'Lien Marked to AICTE New Delhi'
    };

    onSave(newRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-[#2d3436]/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl skeuo-panel-elevated my-8 z-10 overflow-hidden border-2 border-white/90">
        <span className="screw-head absolute top-3 left-3 opacity-90" />
        <span className="screw-head absolute top-3 right-3 opacity-90" />
        <span className="screw-head absolute bottom-3 left-3 opacity-90" />
        <span className="screw-head absolute bottom-3 right-3 opacity-90" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#d1d9e6] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-[#d1d9e6] text-text-muted border border-[#babecc]">
                FDR INTAKE REGISTRATION
              </span>
              <span className="text-[11px] font-mono text-text-muted">Security Deposit Vault Mandate</span>
            </div>
            <h3 className="font-bold text-lg text-text-primary tracking-tight">
              Add New Fixed Deposit Receipt (FDR)
            </h3>
          </div>
          <button onClick={onClose} className="skeuo-btn p-1.5 rounded-lg text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-140px)] overflow-y-auto">
          
          {/* Reference & Institution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                FDR Reference Number <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="e.g. FDR-AICTE-2026-9041"
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input uppercase ${errors.reference ? 'border-[#ff4757]' : ''}`}
              />
              {errors.reference && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.reference}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Associated Institution <span className="text-[#ff4757]">*</span>
              </label>
              <select
                value={formData.institutionCode}
                onChange={(e) => handleInstitutionChange(e.target.value)}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg ${errors.institutionCode ? 'border-[#ff4757]' : ''}`}
              >
                {institutions.map((inst) => (
                  <option key={inst.code} value={inst.code}>
                    {inst.code} — {inst.name}
                  </option>
                ))}
              </select>
              {errors.institutionCode && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.institutionCode}</p>}
            </div>
          </div>

          {/* Bank Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Issuing Bank <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g. State Bank of India"
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.bankName ? 'border-[#ff4757]' : ''}`}
              />
              {errors.bankName && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.bankName}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Branch Location <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="e.g. Nariman Point, Mumbai"
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.branch ? 'border-[#ff4757]' : ''}`}
              />
              {errors.branch && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.branch}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                IFSC Code <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="text"
                value={formData.ifsc}
                onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                placeholder="e.g. SBIN0001823"
                maxLength={11}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input uppercase ${errors.ifsc ? 'border-[#ff4757]' : ''}`}
              />
              {errors.ifsc && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.ifsc}</p>}
            </div>
          </div>

          {/* Certificate Number & Deposit Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Deposit Amount (INR ₹) <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="number"
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                placeholder="e.g. 3500000"
                min="1"
                step="1000"
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.depositAmount ? 'border-[#ff4757]' : ''}`}
              />
              {errors.depositAmount && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.depositAmount}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Interest Rate p.a.
              </label>
              <input
                type="text"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                placeholder="e.g. 7.15%"
                className="w-full px-3 py-2 text-xs font-mono skeuo-input"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Bank Certificate Serial No.
              </label>
              <input
                type="text"
                value={formData.certificateNo}
                onChange={(e) => setFormData({ ...formData, certificateNo: e.target.value })}
                placeholder="e.g. SBI-FDR-889021"
                className="w-full px-3 py-2 text-xs font-mono skeuo-input"
              />
            </div>
          </div>

          {/* Dates: Issue Date & Maturity Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Issue Date <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.issueDate ? 'border-[#ff4757]' : ''}`}
              />
              {errors.issueDate && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.issueDate}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Maturity Date <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="date"
                value={formData.maturityDate}
                onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.maturityDate ? 'border-[#ff4757]' : ''}`}
              />
              {errors.maturityDate && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.maturityDate}</p>}
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Verification Status <span className="text-text-muted text-[10px]">(Initial intake)</span>
              </label>
              <select
                value={formData.verificationStatus}
                onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
              >
                <option value="Pending">Pending Verification (Default)</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Discrepancy">Discrepancy / Audit Issue</option>
              </select>
              <p className="text-[10px] font-mono text-text-muted mt-1">
                New records enter the intake queue as Pending until branch confirmation.
              </p>
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Administrative Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
              >
                <option value="Standard">Standard Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical Priority</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
              Regulatory Observation Notes
            </label>
            <textarea
              rows={2}
              value={formData.discrepancyNote}
              onChange={(e) => setFormData({ ...formData, discrepancyNote: e.target.value })}
              placeholder="Notes on lien clause, bank confirmation letter status, or vault tray location"
              className="w-full px-3 py-2 text-xs font-mono skeuo-input"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#d1d9e6] flex items-center justify-between">
            <span className="text-[11px] font-mono text-text-muted">
              Fields marked <span className="text-[#ff4757]">*</span> are required
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="skeuo-btn px-4 py-2 text-xs font-mono"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="skeuo-btn-accent px-5 py-2 text-xs font-mono font-bold"
              >
                Save & Vault FDR
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}

/**
 * Edit FDR Modal with Strict Verification and State Preservation
 */
function EditFdrModal({ fdr, institutions = [], existingFdrs = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    ...fdr,
    depositAmount: String(fdr.depositAmount || '')
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.reference?.trim()) {
      errs.reference = 'Reference number is required.';
    } else {
      // Check duplicate ignoring own reference
      const duplicate = existingFdrs.some(
        f => f.id !== fdr.id && f.reference?.toLowerCase() === formData.reference.trim().toLowerCase()
      );
      if (duplicate) errs.reference = 'Reference already taken by another FDR record.';
    }

    const amountNum = Number(formData.depositAmount);
    if (!formData.depositAmount || isNaN(amountNum) || amountNum <= 0) {
      errs.depositAmount = 'Deposit amount must be a positive number.';
    }

    if (!formData.branch?.trim()) {
      errs.branch = 'Bank branch location is required.';
    }

    if (!formData.ifsc?.trim()) {
      errs.ifsc = 'Bank IFSC code is required.';
    } else {
      const ifscClean = formData.ifsc.trim().toUpperCase();
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscClean)) {
        errs.ifsc = 'IFSC must be 11 characters (e.g. SBIN0001823: 4 letters, 0, 6 alphanum).';
      }
    }

    if (!formData.issueDate) errs.issueDate = 'Issue date is required.';
    if (!formData.maturityDate) errs.maturityDate = 'Maturity date is required.';
    else if (formData.issueDate && new Date(formData.maturityDate) <= new Date(formData.issueDate)) {
      errs.maturityDate = 'Maturity date must be later than the issue date.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedInst = institutions.find(i => i.code === formData.institutionCode);

    onSave({
      ...fdr, // preserve internal stable id
      ...formData,
      branch: formData.branch?.trim(),
      ifsc: formData.ifsc?.trim().toUpperCase(),
      depositAmount: Number(formData.depositAmount),
      institution: selectedInst ? selectedInst.name : formData.institution
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-[#2d3436]/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl skeuo-panel-elevated my-8 z-10 overflow-hidden border-2 border-white/90">
        <span className="screw-head absolute top-3 left-3 opacity-90" />
        <span className="screw-head absolute top-3 right-3 opacity-90" />
        <span className="screw-head absolute bottom-3 left-3 opacity-90" />
        <span className="screw-head absolute bottom-3 right-3 opacity-90" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#d1d9e6] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-[#d1d9e6] text-text-muted border border-[#babecc]">
                RECORD MODIFICATION
              </span>
              <span className="text-[11px] font-mono text-text-muted">
                ID: <strong className="text-text-primary">{fdr.id}</strong>
              </span>
            </div>
            <h3 className="font-bold text-lg text-text-primary tracking-tight">
              Edit FDR Record — {fdr.reference}
            </h3>
          </div>
          <button onClick={onClose} className="skeuo-btn p-1.5 rounded-lg text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[calc(85vh-140px)] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                FDR Reference Number <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input uppercase ${errors.reference ? 'border-[#ff4757]' : ''}`}
              />
              {errors.reference && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.reference}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Associated Institution
              </label>
              <select
                value={formData.institutionCode}
                onChange={(e) => setFormData({ ...formData, institutionCode: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
              >
                {institutions.map((inst) => (
                  <option key={inst.code} value={inst.code}>
                    {inst.code} — {inst.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bank & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono skeuo-input"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Branch Location <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="text"
                value={formData.branch || ''}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.branch ? 'border-[#ff4757]' : ''}`}
              />
              {errors.branch && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.branch}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                IFSC Code <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="text"
                value={formData.ifsc || ''}
                onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                maxLength={11}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input uppercase ${errors.ifsc ? 'border-[#ff4757]' : ''}`}
              />
              {errors.ifsc && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.ifsc}</p>}
            </div>
          </div>

          {/* Amount & Certificate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Deposit Amount (INR ₹) <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="number"
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.depositAmount ? 'border-[#ff4757]' : ''}`}
              />
              {errors.depositAmount && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.depositAmount}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Interest Rate
              </label>
              <input
                type="text"
                value={formData.interestRate || ''}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono skeuo-input"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Certificate Number
              </label>
              <input
                type="text"
                value={formData.certificateNo || ''}
                onChange={(e) => setFormData({ ...formData, certificateNo: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono skeuo-input"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Issue Date <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="date"
                value={formData.issueDate || ''}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.issueDate ? 'border-[#ff4757]' : ''}`}
              />
              {errors.issueDate && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.issueDate}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Maturity Date <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="date"
                value={formData.maturityDate || ''}
                onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.maturityDate ? 'border-[#ff4757]' : ''}`}
              />
              {errors.maturityDate && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.maturityDate}</p>}
            </div>
          </div>

          {/* Verification Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Verification Status
              </label>
              <select
                value={formData.verificationStatus}
                onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
              >
                <option value="Pending">Institutional Submission (Pending Bank Node)</option>
                <option value="Verified">Verified (Bank-Confirmed Source)</option>
                <option value="Discrepancy">Discrepancy Flagged</option>
                <option value="Expiring Soon">Expiring Soon</option>
              </select>
              <p className="text-[10px] font-mono text-text-muted mt-1">
                Verified status reflects independent Bank Node confirmation / CBS feed cross-check.
              </p>
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Administrative Priority
              </label>
              <select
                value={formData.priority || 'Standard'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
              >
                <option value="Standard">Standard Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical Priority</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
              Regulatory Notes & Observation Log
            </label>
            <textarea
              rows={2}
              value={formData.discrepancyNote || ''}
              onChange={(e) => setFormData({ ...formData, discrepancyNote: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono skeuo-input"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#d1d9e6] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="skeuo-btn px-4 py-2 text-xs font-mono"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="skeuo-btn-accent px-5 py-2 text-xs font-mono font-bold"
            >
              Save Changes
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

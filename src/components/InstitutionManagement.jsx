import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  ExternalLink,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  formatINR,
  formatDate,
  getAssociatedFdrs,
  ALL_INDIAN_STATES_AND_UTS,
  detectLocationFromPinCode
} from '../data/sampleFdrData';
import { exportInstitutionsToCsv } from '../utils/exportUtils';

export function InstitutionManagement({
  institutions = [],
  fdrRecords = [],
  onAddInstitution,
  onUpdateInstitution,
  onDeleteInstitution,
  onViewFdrDetails,
  onOpenAddModal = false,
  onCloseAddModal,
  externalSearchTerm = ''
}) {
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Sync external search term from Header
  React.useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(onOpenAddModal);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState(null);

  // Sync external add modal trigger if passed
  React.useEffect(() => {
    if (onOpenAddModal) {
      setShowRegisterModal(true);
    }
  }, [onOpenAddModal]);

  // Unique lists for filter dropdowns - all 28 States & 8 Union Territories in India
  const availableStates = useMemo(() => {
    return ['All', ...ALL_INDIAN_STATES_AND_UTS];
  }, []);

  const availableTypes = useMemo(() => {
    const set = new Set(institutions.map(i => i.type).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [institutions]);

  // Compute institution metrics and filter
  const processedInstitutions = useMemo(() => {
    return institutions
      .map(inst => {
        const linkedFdrs = getAssociatedFdrs(inst, fdrRecords);
        const fdrCount = linkedFdrs.length;
        const totalDeposit = linkedFdrs.reduce((sum, f) => sum + (Number(f.depositAmount) || 0), 0);
        return {
          ...inst,
          linkedFdrs,
          fdrCount,
          totalDeposit
        };
      })
      .filter(inst => {
        // State filter
        if (selectedState !== 'All' && inst.state !== selectedState) return false;

        // Type filter
        if (selectedType !== 'All' && inst.type !== selectedType) return false;

        // Search text
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          const matchesName = inst.name?.toLowerCase().includes(q);
          const matchesPid = inst.pid?.toLowerCase().includes(q);
          const matchesCode = inst.code?.toLowerCase().includes(q);
          const matchesCity = inst.city?.toLowerCase().includes(q);
          const matchesPincode = inst.pincode?.includes(q);
          return matchesName || matchesPid || matchesCode || matchesCity || matchesPincode;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'name') {
          const res = (a.name || '').localeCompare(b.name || '');
          return sortDirection === 'asc' ? res : -res;
        }
        if (sortField === 'fdrCount') {
          return sortDirection === 'asc' ? a.fdrCount - b.fdrCount : b.fdrCount - a.fdrCount;
        }
        if (sortField === 'totalDeposit') {
          return sortDirection === 'asc' ? a.totalDeposit - b.totalDeposit : b.totalDeposit - a.totalDeposit;
        }
        return 0;
      });
  }, [institutions, fdrRecords, searchTerm, selectedState, selectedType, sortField, sortDirection]);

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
    setSelectedState('All');
    setSelectedType('All');
  };

  const hasActiveFilters = searchTerm !== '' || selectedState !== 'All' || selectedType !== 'All';

  // Overall totals
  const totalCorpus = useMemo(() => {
    return fdrRecords.reduce((sum, f) => sum + (Number(f.depositAmount) || 0), 0);
  }, [fdrRecords]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Metrics bar */}
      <div className="p-5 rounded-xl skeuo-panel border-l-4 border-l-accent-orange relative overflow-hidden">
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#d1d9e6] text-text-muted border border-[#babecc]">
                REGULATORY PID DIRECTORY
              </span>
              <span className="text-xs font-mono text-text-muted">
                AICTE Act Clause 10(k) Institutional Registry
              </span>
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Institution Management
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Approved technical institutes, engineering colleges, polytechnics, and trusts holding security deposit mandates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportInstitutionsToCsv(processedInstitutions, 'AICTE_Institutional_Registry.csv')}
              className="skeuo-panel px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 hover:border-accent-orange text-text-primary shadow-sm hover:text-accent-orange transition-colors"
              title="Export filtered institutions to CSV"
            >
              <FileText className="w-4 h-4 text-accent-orange" />
              <span>Export Registry</span>
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="skeuo-btn-accent px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Register Institution</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Counter Badges */}
        <div className="mt-4 pt-3 border-t border-[#d1d9e6]/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
            <span className="text-text-muted text-[11px]">Institutions</span>
            <span className="font-bold text-text-primary text-sm">{institutions.length}</span>
          </div>
          <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
            <span className="text-text-muted text-[11px]">Associated FDRs</span>
            <span className="font-bold text-text-primary text-sm">{fdrRecords.length}</span>
          </div>
          <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
            <span className="text-text-muted text-[11px]">Corpus Held</span>
            <span className="font-bold text-accent-orange text-sm">{formatINR(totalCorpus, true)}</span>
          </div>
          <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
            <span className="text-text-muted text-[11px]">States Covered</span>
            <span className="font-bold text-text-primary text-sm">{availableStates.length - 1}</span>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="skeuo-panel p-5 relative overflow-hidden">
        {/* Hardware Screws at 4 corners */}
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />
        <span className="screw-head absolute bottom-3 left-3 opacity-80" />
        <span className="screw-head absolute bottom-3 right-3 opacity-80" />

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#e8edf4] p-3 rounded-xl border border-[#d1d9e6]">
          
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by institution name, PID, or code..."
              className="w-full pl-9 pr-3 py-2 text-xs font-mono skeuo-input placeholder:text-text-muted/60"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* State Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-text-muted hidden sm:inline">State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-orange"
              >
                {availableStates.map(st => (
                  <option key={st} value={st}>{st === 'All' ? 'All States' : st}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-text-muted hidden sm:inline">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-orange max-w-[150px] truncate"
              >
                {availableTypes.map(tp => (
                  <option key={tp} value={tp}>{tp === 'All' ? 'All Types' : tp}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="skeuo-btn px-2.5 py-1.5 text-[11px] font-mono text-accent hover:bg-accent/10 rounded"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Counter readout */}
        <div className="mt-3 flex items-center justify-between text-xs font-mono text-text-muted px-1">
          <span>
            Showing <strong className="text-text-primary">{processedInstitutions.length}</strong> of {institutions.length} institutions
          </span>
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="led-indicator led-green" />
            <span>AICTE PID Database Linked</span>
          </span>
        </div>

        {/* Institutions Table */}
        <div className="mt-3 overflow-x-auto rounded-xl border border-[#d1d9e6] bg-panel">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#e4ebf5] border-b border-[#d1d9e6] text-text-muted font-mono uppercase text-[11px] tracking-wider select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-text-primary"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Institution Name & Trust</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">PID & Code</th>
                <th className="py-3 px-4 font-semibold">Type & State</th>
                <th
                  onClick={() => handleSort('fdrCount')}
                  className="py-3 px-4 font-semibold text-center cursor-pointer hover:text-text-primary"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Associated FDRs</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalDeposit')}
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-text-primary"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Deposit</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Contact</th>
                <th className="py-3 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#d1d9e6]/70 font-mono">
              {processedInstitutions.length > 0 ? (
                processedInstitutions.map((inst) => (
                  <tr
                    key={inst.id || inst.code}
                    className="hover:bg-[#f8fafd] transition-colors group"
                  >
                    {/* Name & Trust */}
                    <td className="py-3.5 px-4 font-sans max-w-xs">
                      <div
                        onClick={() => {
                          setSelectedInstitution(inst);
                          setIsEditing(false);
                        }}
                        className="font-bold text-text-primary hover:text-accent-orange cursor-pointer transition-colors"
                      >
                        {inst.name}
                      </div>
                      <div className="text-[11px] font-mono text-text-muted mt-0.5 truncate">
                        Trust: {inst.trust || 'N/A'}
                      </div>
                    </td>

                    {/* PID & Code */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-accent-orange text-xs">
                        {inst.code}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        PID: {inst.pid || '—'}
                      </div>
                    </td>

                    {/* Type & State */}
                    <td className="py-3.5 px-4">
                      <div className="text-text-primary font-medium text-xs truncate max-w-[170px]" title={inst.type}>
                        {inst.type}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-text-muted" />
                        <span>{inst.city ? `${inst.city}, ` : ''}{inst.state}{inst.pincode ? ` (${inst.pincode})` : ''}</span>
                      </div>
                    </td>

                    {/* Associated FDRs */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        inst.fdrCount > 0
                          ? 'bg-[#eafaf1] text-[#1b7943] border-[#b7ebcd] shadow-[inset_1px_1px_2px_#babecc]'
                          : 'bg-panel text-text-muted border-recessed shadow-[inset_1px_1px_2px_#babecc]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${inst.fdrCount > 0 ? 'bg-[#2ed573]' : 'bg-[#a3b1c6]'}`} />
                        <span>{inst.fdrCount} FDR{inst.fdrCount !== 1 ? 's' : ''}</span>
                      </span>
                    </td>

                    {/* Total Deposit */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-sm text-text-primary">
                        {formatINR(inst.totalDeposit)}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 text-xs font-sans">
                      <div className="text-text-primary font-medium truncate max-w-[140px]">
                        {inst.contactPerson || '—'}
                      </div>
                      <div className="text-[10px] font-mono text-text-muted truncate max-w-[140px]">
                        {inst.email || inst.phone || '—'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedInstitution(inst);
                          setIsEditing(false);
                        }}
                        className="skeuo-btn px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-text-primary hover:text-accent-orange flex items-center gap-1.5 mx-auto"
                        title="View & Edit Institution Dossier"
                      >
                        <Eye className="w-3.5 h-3.5 text-accent-orange" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty state */
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto p-6 rounded-2xl skeuo-recessed text-text-muted">
                      <AlertCircle className="w-10 h-10 text-accent-orange mx-auto mb-3" />
                      <h3 className="text-sm font-bold text-text-primary font-sans">
                        No institutions match current filters
                      </h3>
                      <p className="text-xs font-mono mt-1 leading-relaxed">
                        Try adjusting your search query, state, or institution type selection.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-4 skeuo-btn px-3 py-1.5 rounded-lg text-xs font-mono text-accent-orange font-semibold"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono text-text-muted">
          <span>Bureau Registry Format: AICTE-PID-2026</span>
          <span>Regulated under AICTE Security Deposit Governance Norms</span>
        </div>
      </div>

      {/* Register Institution Modal */}
      {showRegisterModal && (
        <RegisterInstitutionModal
          existingInstitutions={institutions}
          onClose={() => {
            setShowRegisterModal(false);
            if (onCloseAddModal) onCloseAddModal();
          }}
          onSave={(newInst) => {
            onAddInstitution(newInst);
            setShowRegisterModal(false);
            if (onCloseAddModal) onCloseAddModal();
          }}
        />
      )}

      {/* Institution Details & Edit Modal */}
      {selectedInstitution && (
        <InstitutionDetailsModal
          institution={selectedInstitution}
          fdrRecords={fdrRecords}
          allInstitutions={institutions}
          isEditing={isEditing}
          onSetEditing={setIsEditing}
          onClose={() => setSelectedInstitution(null)}
          onUpdate={(updated) => {
            onUpdateInstitution(updated);
            setSelectedInstitution(updated);
            setIsEditing(false);
          }}
          onDelete={(id) => {
            const linked = getAssociatedFdrs(selectedInstitution, fdrRecords);
            if (linked.length > 0) {
              setDeleteWarning({
                count: linked.length,
                name: selectedInstitution.name
              });
              return;
            }
            if (window.confirm(`Are you sure you want to delete institution ${selectedInstitution.name}?`)) {
              onDeleteInstitution(id);
              setSelectedInstitution(null);
            }
          }}
          onViewFdrDetails={onViewFdrDetails}
        />
      )}

      {/* Delete Guard Warning Modal */}
      {deleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md skeuo-panel-elevated p-6 border-2 border-[#ff4757] shadow-skeuo-modal animate-in fade-in">
            <span className="screw-head absolute top-3 left-3 opacity-90" />
            <span className="screw-head absolute top-3 right-3 opacity-90" />

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ffebee] text-[#d32f2f] flex items-center justify-center flex-shrink-0 border border-[#ff4757]/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-text-primary">
                  Deletion Blocked: Active FDRs Linked
                </h3>
                <p className="text-xs text-text-muted mt-2 leading-relaxed">
                  <strong>{deleteWarning.name}</strong> currently holds <strong>{deleteWarning.count} active Fixed Deposit Receipt(s)</strong> under Regulation Bureau lien.
                </p>
                <div className="mt-3 p-2.5 rounded-lg skeuo-recessed text-[11px] font-mono text-[#d32f2f]">
                  To protect administrative audit integrity, an institution with vaulted FDR records cannot be removed. You must first discharge or reassign the associated FDRs.
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setDeleteWarning(null)}
                className="skeuo-btn-accent px-4 py-2 rounded-lg text-xs font-mono"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Register Institution Modal Form
 */
function RegisterInstitutionModal({ existingInstitutions = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    pid: '',
    type: 'Technical Degree (UG/PG)',
    pincode: '',
    state: 'Maharashtra',
    city: '',
    address: '',
    trust: '',
    contactPerson: '',
    email: '',
    phone: ''
  });

  const [detectedLocation, setDetectedLocation] = useState(null);

  const [errors, setErrors] = useState({});

  // Real-time PIN code detection for Indian postal circles
  const handlePinCodeChange = (raw) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => {
      const next = { ...prev, pincode: cleaned };
      if (cleaned.length === 6) {
        const loc = detectLocationFromPinCode(cleaned);
        if (loc) {
          next.state = loc.state;
          next.city = loc.city;
          setDetectedLocation(loc);
        } else {
          setDetectedLocation(null);
        }
      } else {
        setDetectedLocation(null);
      }
      return next;
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Institution name is required.';
    
    if (!formData.code.trim()) {
      errs.code = 'Institution code is required.';
    } else {
      // Check uniqueness of code
      const duplicateCode = existingInstitutions.some(
        i => i.code?.toLowerCase() === formData.code.trim().toLowerCase()
      );
      if (duplicateCode) errs.code = 'Institution code already exists. Must be unique.';
    }

    if (!formData.type?.trim()) {
      errs.type = 'Institution type / discipline is required.';
    }

    if (!formData.pincode.trim()) {
      errs.pincode = '6-digit PIN code is required.';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errs.pincode = 'Must be an exact 6-digit Indian PIN code (e.g. 560001).';
    }

    if (!formData.state?.trim()) {
      errs.state = 'State / Union Territory is required.';
    }

    if (!formData.city.trim()) {
      errs.city = 'City / Town is required.';
    }

    if (!formData.address.trim()) {
      errs.address = 'Campus street address is required.';
    }

    if (!formData.contactPerson.trim()) {
      errs.contactPerson = 'Authorized contact person is required.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Contact email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Please provide a valid email address (e.g. contact@college.edu).';
      }
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Contact phone number is required.';
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 10) {
        errs.phone = 'Phone number must have at least 10 digits.';
      }
    }

    // PID uniqueness if provided
    if (formData.pid.trim()) {
      const duplicatePid = existingInstitutions.some(
        i => i.pid?.toLowerCase() === formData.pid.trim().toLowerCase()
      );
      if (duplicatePid) errs.pid = 'PID already registered to another institution.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newInst = {
      ...formData,
      id: `INST-${formData.code.trim().toUpperCase()}`,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      pid: formData.pid.trim() || `PID-${Date.now().toString().slice(-6)}`,
      pincode: formData.pincode.trim(),
      state: formData.state.trim(),
      city: formData.city.trim(),
      address: formData.address.trim(),
      contactPerson: formData.contactPerson.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim()
    };

    onSave(newInst);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-[#2d3436]/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl skeuo-panel-elevated my-8 z-10 overflow-hidden border-2 border-white/90">
        {/* Hardware Screws */}
        <span className="screw-head absolute top-3 left-3 opacity-90" />
        <span className="screw-head absolute top-3 right-3 opacity-90" />
        <span className="screw-head absolute bottom-3 left-3 opacity-90" />
        <span className="screw-head absolute bottom-3 right-3 opacity-90" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#d1d9e6] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-[#d1d9e6] text-text-muted border border-[#babecc]">
                INSTITUTE ONBOARDING
              </span>
              <span className="text-[11px] font-mono text-text-muted">AICTE Bureau Mandate</span>
            </div>
            <h3 className="font-bold text-lg text-text-primary tracking-tight">
              Register New Technical Institution
            </h3>
          </div>
          <button onClick={onClose} className="skeuo-btn p-1.5 rounded-lg text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-140px)] overflow-y-auto">
          
          {/* Required: Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Institution Name <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. National Institute of Technology"
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.name ? 'border-[#ff4757] ring-1 ring-[#ff4757]' : ''}`}
              />
              {errors.name && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Institute Code <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. NIT-DL-099"
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input uppercase ${errors.code ? 'border-[#ff4757] ring-1 ring-[#ff4757]' : ''}`}
              />
              {errors.code && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.code}</p>}
            </div>
          </div>

          {/* PID & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Permanent Institute ID (PID) <span className="text-text-muted text-[10px]">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.pid}
                onChange={(e) => setFormData({ ...formData, pid: e.target.value })}
                placeholder="e.g. 1-4829104"
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.pid ? 'border-[#ff4757] ring-1 ring-[#ff4757]' : ''}`}
              />
              {errors.pid && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.pid}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                Institution Type / Discipline <span className="text-[#ff4757]">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
              >
                <option value="Technical Degree (UG/PG)">Technical Degree (UG/PG)</option>
                <option value="Engineering & Technology">Engineering & Technology</option>
                <option value="Diploma Engineering">Diploma Engineering</option>
                <option value="Polytechnic / Applied Arts">Polytechnic / Applied Arts</option>
                <option value="Management Institute (MBA/PGDM)">Management Institute (MBA/PGDM)</option>
                <option value="Autonomous Engineering College">Autonomous Engineering College</option>
                <option value="Pharmacy / Architecture">Pharmacy / Architecture</option>
              </select>
              {errors.type && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.type}</p>}
            </div>
          </div>

          {/* Trust */}
          <div>
            <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
              Sponsoring Trust / Society <span className="text-text-muted text-[10px]">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.trust}
              onChange={(e) => setFormData({ ...formData, trust: e.target.value })}
              placeholder="e.g. Vidya Bharati Educational Society"
              className="w-full px-3 py-2 text-xs font-mono skeuo-input"
            />
          </div>

          {/* Location: PIN Code (with Auto-detection), State, City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono font-semibold text-text-primary">
                  Postal PIN Code <span className="text-[#ff4757]">*</span>
                </label>
              </div>
              <input
                type="text"
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => handlePinCodeChange(e.target.value)}
                placeholder="e.g. 560001"
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.pincode ? 'border-[#ff4757] ring-1 ring-[#ff4757]' : ''}`}
              />
              {detectedLocation && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-[#1b7943] mt-1">
                  <Sparkles className="w-3 h-3 text-[#1b7943]" />
                  <span>Detected: {detectedLocation.city}, {detectedLocation.state}</span>
                </div>
              )}
              {errors.pincode && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.pincode}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                State / UT <span className="text-[#ff4757]">*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className={`w-full px-3 py-2 text-xs font-mono skeuo-recessed text-text-primary border rounded-lg ${errors.state ? 'border-[#ff4757]' : 'border-[#babecc]'}`}
              >
                <option value="">-- Select State / UT --</option>
                {ALL_INDIAN_STATES_AND_UTS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              {errors.state && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
                City / Town <span className="text-[#ff4757]">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.city ? 'border-[#ff4757]' : ''}`}
              />
              {errors.city && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.city}</p>}
            </div>
          </div>

          {/* Campus Street Address */}
          <div>
            <label className="text-xs font-mono font-semibold text-text-primary block mb-1">
              Campus Street Address <span className="text-[#ff4757]">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Campus address, road, sector, or postal road"
              className={`w-full px-3 py-2 text-xs font-mono skeuo-input ${errors.address ? 'border-[#ff4757]' : ''}`}
            />
            {errors.address && <p className="text-[10px] font-mono text-[#ff4757] mt-1">{errors.address}</p>}
          </div>

          {/* Mandatory Contact Details */}
          <div className="p-3.5 rounded-xl bg-panel border border-[#d1d9e6] space-y-3">
            <span className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider block">
              Authorized Institutional Contact <span className="text-[#ff4757]">*</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono font-semibold text-text-primary block mb-1">
                  Contact Person <span className="text-[#ff4757]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Principal / Registrar"
                  className={`w-full px-2.5 py-1.5 text-xs font-mono skeuo-input ${errors.contactPerson ? 'border-[#ff4757]' : ''}`}
                />
                {errors.contactPerson && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.contactPerson}</p>}
              </div>

              <div>
                <label className="text-[11px] font-mono font-semibold text-text-primary block mb-1">
                  Email Address <span className="text-[#ff4757]">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@college.ac.in"
                  className={`w-full px-2.5 py-1.5 text-xs font-mono skeuo-input ${errors.email ? 'border-[#ff4757]' : ''}`}
                />
                {errors.email && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.email}</p>}
              </div>

              <div>
                <label className="text-[11px] font-mono font-semibold text-text-primary block mb-1">
                  Phone Number <span className="text-[#ff4757]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 80 2345 6789"
                  className={`w-full px-2.5 py-1.5 text-xs font-mono skeuo-input ${errors.phone ? 'border-[#ff4757]' : ''}`}
                />
                {errors.phone && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#d1d9e6] flex items-center justify-between">
            <span className="text-[11px] font-mono text-text-muted">
              Fields marked <span className="text-[#ff4757]">*</span> are mandatory AICTE bureau records
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
                Save & Register Institution
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}

/**
 * Institution Details & In-Place Editing Modal
 */
function InstitutionDetailsModal({
  institution,
  fdrRecords,
  allInstitutions,
  isEditing,
  onSetEditing,
  onClose,
  onUpdate,
  onDelete,
  onViewFdrDetails
}) {
  const [formData, setFormData] = useState({
    ...institution,
    pincode: institution.pincode || '',
    phone: institution.phone || ''
  });
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [errors, setErrors] = useState({});

  // Real-time PIN code detection
  const handlePinCodeChange = (raw) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => {
      const next = { ...prev, pincode: cleaned };
      if (cleaned.length === 6) {
        const loc = detectLocationFromPinCode(cleaned);
        if (loc) {
          next.state = loc.state;
          next.city = loc.city;
          setDetectedLocation(loc);
        } else {
          setDetectedLocation(null);
        }
      } else {
        setDetectedLocation(null);
      }
      return next;
    });
  };

  const associatedFdrs = useMemo(() => {
    return getAssociatedFdrs(institution, fdrRecords);
  }, [institution, fdrRecords]);

  const totalDeposit = useMemo(() => {
    return associatedFdrs.reduce((sum, f) => sum + (Number(f.depositAmount) || 0), 0);
  }, [associatedFdrs]);

  const validate = () => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = 'Institution name is required.';
    
    if (!formData.code?.trim()) {
      errs.code = 'Institution code is required.';
    } else {
      // Check duplicate code ignoring own code
      const duplicateCode = allInstitutions.some(
        i => i.id !== institution.id && i.code?.toLowerCase() === formData.code.trim().toLowerCase()
      );
      if (duplicateCode) errs.code = 'Code taken by another institution.';
    }

    if (!formData.pincode?.trim()) {
      errs.pincode = '6-digit PIN code is required.';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errs.pincode = 'Must be exact 6 digits (e.g. 560001).';
    }

    if (!formData.state?.trim()) errs.state = 'State / UT is required.';
    if (!formData.city?.trim()) errs.city = 'City / Town is required.';
    if (!formData.address?.trim()) errs.address = 'Campus street address is required.';
    if (!formData.contactPerson?.trim()) errs.contactPerson = 'Contact person is required.';

    if (!formData.email?.trim()) {
      errs.email = 'Contact email is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Invalid email address.';
      }
    }

    if (!formData.phone?.trim()) {
      errs.phone = 'Phone number is required.';
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 10) {
        errs.phone = 'Phone number must have at least 10 digits.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onUpdate({
      ...formData,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      pincode: formData.pincode.trim(),
      state: formData.state.trim(),
      city: formData.city.trim(),
      address: formData.address.trim(),
      contactPerson: formData.contactPerson.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-[#2d3436]/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl skeuo-panel-elevated my-8 z-10 overflow-hidden border-2 border-white/90">
        <span className="screw-head absolute top-3 left-3 opacity-90" />
        <span className="screw-head absolute top-3 right-3 opacity-90" />
        <span className="screw-head absolute bottom-3 left-3 opacity-90" />
        <span className="screw-head absolute bottom-3 right-3 opacity-90" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#d1d9e6] bg-[#f0f2f5]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#d1d9e6] text-text-muted border border-[#babecc]">
                  OFFICIAL INSTITUTION DOSSIER
                </span>
                <span className="text-xs font-mono text-text-muted">
                  PID: <strong className="text-text-primary">{institution.pid || '—'}</strong>
                </span>
              </div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                {institution.name}
              </h2>
              <p className="text-xs font-mono text-text-muted mt-0.5">
                Code: <span className="text-accent-orange font-bold">{institution.code}</span> | State: {institution.state} {institution.pincode ? `(${institution.pincode})` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => onSetEditing(true)}
                  className="skeuo-btn px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 text-accent-orange"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setFormData({ ...institution });
                    onSetEditing(false);
                    setErrors({});
                  }}
                  className="skeuo-btn px-3 py-1.5 rounded-lg text-xs font-mono"
                >
                  Cancel Edit
                </button>
              )}

              <button onClick={onClose} className="skeuo-btn p-2 rounded-lg text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-160px)] overflow-y-auto">
          
          {/* Summary Badges Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl skeuo-recessed">
              <span className="text-[11px] font-mono text-text-muted uppercase">Associated FDRs</span>
              <div className="text-2xl font-bold font-mono text-text-primary mt-1">
                {associatedFdrs.length}
              </div>
              <span className="text-[10px] font-mono text-accent-orange">
                In AICTE Vault Custody
              </span>
            </div>

            <div className="p-3.5 rounded-xl skeuo-recessed">
              <span className="text-[11px] font-mono text-text-muted uppercase">Total Deposit Pledged</span>
              <div className="text-2xl font-bold font-mono text-text-primary mt-1">
                {formatINR(totalDeposit)}
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                Cumulative Lien Value
              </span>
            </div>

            <div className="p-3.5 rounded-xl skeuo-recessed">
              <span className="text-[11px] font-mono text-text-muted uppercase">Affiliation Category</span>
              <div className="text-xs font-bold font-mono text-text-primary mt-1 truncate" title={institution.type}>
                {institution.type}
              </div>
              <span className="text-[10px] font-mono text-[#1b7943]">
                AICTE Recognition Active
              </span>
            </div>
          </div>

          {/* Edit Form or Information Card */}
          {isEditing ? (
            <div className="p-4 rounded-xl bg-panel border border-[#d1d9e6] space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent-orange block">
                Editing Institutional Record
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-text-muted block mb-1">
                    Institution Name <span className="text-[#ff4757]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-1.5 text-xs font-mono skeuo-input ${errors.name ? 'border-[#ff4757]' : ''}`}
                  />
                  {errors.name && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.name}</p>}
                </div>

                <div>
                  <label className="text-[11px] font-mono text-text-muted block mb-1">
                    Code <span className="text-[#ff4757]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className={`w-full px-3 py-1.5 text-xs font-mono skeuo-input uppercase ${errors.code ? 'border-[#ff4757]' : ''}`}
                  />
                  {errors.code && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.code}</p>}
                </div>

                <div>
                  <label className="text-[11px] font-mono text-text-muted block mb-1">PID (Permanent Institute ID)</label>
                  <input
                    type="text"
                    value={formData.pid || ''}
                    onChange={(e) => setFormData({ ...formData, pid: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono skeuo-input"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-text-muted block mb-1">Institution Discipline / Type</label>
                  <select
                    value={formData.type || 'Technical Degree (UG/PG)'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg"
                  >
                    <option value="Technical Degree (UG/PG)">Technical Degree (UG/PG)</option>
                    <option value="Engineering & Technology">Engineering & Technology</option>
                    <option value="Diploma Engineering">Diploma Engineering</option>
                    <option value="Polytechnic / Applied Arts">Polytechnic / Applied Arts</option>
                    <option value="Management Institute (MBA/PGDM)">Management Institute (MBA/PGDM)</option>
                    <option value="Autonomous Engineering College">Autonomous Engineering College</option>
                    <option value="Pharmacy / Architecture">Pharmacy / Architecture</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-mono text-text-muted block mb-1">Sponsoring Trust / Society</label>
                  <input
                    type="text"
                    value={formData.trust || ''}
                    onChange={(e) => setFormData({ ...formData, trust: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono skeuo-input"
                  />
                </div>

                {/* Location: PIN Code, State, City */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-text-muted block mb-1">
                      Postal PIN Code <span className="text-[#ff4757]">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pincode || ''}
                      onChange={(e) => handlePinCodeChange(e.target.value)}
                      placeholder="e.g. 560001"
                      className={`w-full px-3 py-1.5 text-xs font-mono skeuo-input ${errors.pincode ? 'border-[#ff4757]' : ''}`}
                    />
                    {detectedLocation && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-[#1b7943] mt-1">
                        <Sparkles className="w-3 h-3 text-[#1b7943]" />
                        <span>Detected: {detectedLocation.city}, {detectedLocation.state}</span>
                      </div>
                    )}
                    {errors.pincode && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.pincode}</p>}
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-text-muted block mb-1">
                      State / UT <span className="text-[#ff4757]">*</span>
                    </label>
                    <select
                      value={formData.state || ''}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className={`w-full px-3 py-1.5 text-xs font-mono skeuo-recessed text-text-primary border rounded-lg ${errors.state ? 'border-[#ff4757]' : 'border-[#babecc]'}`}
                    >
                      <option value="">-- Select State / UT --</option>
                      {ALL_INDIAN_STATES_AND_UTS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-text-muted block mb-1">
                      City / Town <span className="text-[#ff4757]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={`w-full px-3 py-1.5 text-xs font-mono skeuo-input ${errors.city ? 'border-[#ff4757]' : ''}`}
                    />
                    {errors.city && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.city}</p>}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-mono text-text-muted block mb-1">
                    Street Address <span className="text-[#ff4757]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full px-3 py-1.5 text-xs font-mono skeuo-input ${errors.address ? 'border-[#ff4757]' : ''}`}
                  />
                  {errors.address && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.address}</p>}
                </div>

                <div>
                  <label className="text-[11px] font-mono text-text-muted block mb-1">
                    Contact Person <span className="text-[#ff4757]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className={`w-full px-3 py-1.5 text-xs font-mono skeuo-input ${errors.contactPerson ? 'border-[#ff4757]' : ''}`}
                  />
                  {errors.contactPerson && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.contactPerson}</p>}
                </div>

                <div>
                  <label className="text-[11px] font-mono text-text-muted block mb-1">
                    Contact Email <span className="text-[#ff4757]">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-1.5 text-xs font-mono skeuo-input ${errors.email ? 'border-[#ff4757]' : ''}`}
                  />
                  {errors.email && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.email}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-mono text-text-muted block mb-1">
                    Phone Number <span className="text-[#ff4757]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 80 2345 6789"
                    className={`w-full px-3 py-1.5 text-xs font-mono skeuo-input ${errors.phone ? 'border-[#ff4757]' : ''}`}
                  />
                  {errors.phone && <p className="text-[10px] font-mono text-[#ff4757] mt-0.5">{errors.phone}</p>}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...institution,
                      pincode: institution.pincode || '',
                      phone: institution.phone || ''
                    });
                    onSetEditing(false);
                  }}
                  className="skeuo-btn px-3 py-1.5 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="skeuo-btn-accent px-4 py-1.5 text-xs font-mono font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            /* Read-Only Profile Overview */
            <div className="p-4 rounded-xl bg-panel border border-[#d1d9e6]">
              <h4 className="text-xs font-mono font-bold uppercase text-text-muted mb-3 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-accent-orange" />
                <span>Institution Administrative Registry</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-text-muted">Campus Address:</span>
                  <p className="font-semibold text-text-primary mt-0.5 font-sans">
                    {institution.address || '—'}, {institution.city ? `${institution.city}, ` : ''}{institution.state} {institution.pincode ? `— PIN: ${institution.pincode}` : ''}
                  </p>
                </div>

                <div>
                  <span className="text-text-muted">Sponsoring Body / Trust:</span>
                  <p className="font-semibold text-text-primary mt-0.5 font-sans">
                    {institution.trust || '—'}
                  </p>
                </div>

                <div>
                  <span className="text-text-muted">Authorized Contact Person:</span>
                  <p className="font-semibold text-text-primary mt-0.5">
                    {institution.contactPerson || '—'}
                  </p>
                </div>

                <div>
                  <span className="text-text-muted">Communications:</span>
                  <p className="font-semibold text-text-primary mt-0.5">
                    {institution.email || '—'} {institution.phone ? `(${institution.phone})` : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Associated FDR Records Sub-Table */}
          <div className="p-4 rounded-xl skeuo-recessed border border-[#babecc]/60">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono font-bold uppercase text-text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent-orange" />
                <span>Associated FDR Records ({associatedFdrs.length})</span>
              </h4>
              <span className="text-[11px] font-mono text-text-muted">
                Vault Total: <strong>{formatINR(totalDeposit)}</strong>
              </span>
            </div>

            {associatedFdrs.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-[#babecc] bg-panel">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#e4ebf5] border-b border-[#d1d9e6] text-[10px] font-mono uppercase text-text-muted">
                      <th className="py-2 px-3">FDR Ref</th>
                      <th className="py-2 px-3">Bank</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3">Maturity</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-center">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d1d9e6]/70 font-mono text-[11px]">
                    {associatedFdrs.map((fdr) => (
                      <tr key={fdr.id} className="hover:bg-white">
                        <td className="py-2 px-3 font-bold text-text-primary">{fdr.reference}</td>
                        <td className="py-2 px-3">{fdr.bankName}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatINR(fdr.depositAmount)}</td>
                        <td className="py-2 px-3">{formatDate(fdr.maturityDate)}</td>
                        <td className="py-2 px-3">{fdr.verificationStatus}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => {
                              onViewFdrDetails(fdr);
                            }}
                            className="skeuo-btn px-2 py-0.5 text-[10px] font-mono text-accent-orange hover:text-text-primary"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs font-mono text-text-muted bg-panel rounded-lg">
                No Fixed Deposit Receipts currently linked to this institution.
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#e8edf4] border-t border-[#d1d9e6] flex items-center justify-between">
          <button
            onClick={() => onDelete(institution.id)}
            className="skeuo-btn px-3 py-1.5 text-xs font-mono text-[#ff4757] hover:bg-[#ffebee] flex items-center gap-1.5"
            title="Delete this institution"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Institution</span>
          </button>

          <button
            onClick={onClose}
            className="skeuo-btn-accent px-5 py-2 text-xs font-mono font-bold"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}

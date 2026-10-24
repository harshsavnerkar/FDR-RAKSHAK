import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  Building,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Check
} from 'lucide-react';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { formatINR, formatDate } from '../data/sampleFdrData';

export function FDRTable({ records = [], onViewDetails, initialStatusFilter = "All", externalSearchTerm = "" }) {
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortField, setSortField] = useState('maturityDate');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  // Filter options and dynamic counts
  const statusOptions = ['All', 'Verified', 'Pending', 'Discrepancy', 'Expiring Soon', 'Overdue'];
  const priorityOptions = ['All', 'Critical', 'High', 'Medium', 'Standard'];

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return records
      .filter((item) => {
        // Status filter
        if (statusFilter !== 'All') {
          if (statusFilter === 'Overdue') {
            const isExpired = item.maturityDate && new Date(item.maturityDate) < today;
            const isCritical = String(item.priority || '').toUpperCase() === 'CRITICAL';
            if (!isExpired && !isCritical) return false;
          } else if (item.verificationStatus !== statusFilter) {
            return false;
          }
        }

        // Priority filter
        if (priorityFilter !== 'All' && String(item.priority || '').toUpperCase() !== priorityFilter.toUpperCase()) {
          return false;
        }

        // Text search filter
        if (searchTerm.trim() !== '') {
          const query = searchTerm.toLowerCase();
          const matchesRef = item.reference.toLowerCase().includes(query);
          const matchesInst = item.institution.toLowerCase().includes(query);
          const matchesCode = item.institutionCode.toLowerCase().includes(query);
          const matchesBank = item.bankName.toLowerCase().includes(query);
          const matchesState = item.state.toLowerCase().includes(query);
          const matchesCert = item.certificateNo.toLowerCase().includes(query);
          return matchesRef || matchesInst || matchesCode || matchesBank || matchesState || matchesCert;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (sortField === 'depositAmount') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        if (sortField === 'maturityDate') {
          return sortDirection === 'asc'
            ? new Date(valA) - new Date(valB)
            : new Date(valB) - new Date(valA);
        }

        // String comparison
        const comp = String(valA).localeCompare(String(valB));
        return sortDirection === 'asc' ? comp : -comp;
      });
  }, [records, searchTerm, statusFilter, priorityFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusCount = (status) => {
    if (status === 'All') return records.length;
    return records.filter(r => r.verificationStatus === status).length;
  };

  return (
    <div className="skeuo-panel p-5 relative overflow-hidden">
      
      {/* Structural Corner Screws */}
      <span className="screw-head absolute top-3 left-3 opacity-80" />
      <span className="screw-head absolute top-3 right-3 opacity-80" />
      <span className="screw-head absolute bottom-3 left-3 opacity-80" />
      <span className="screw-head absolute bottom-3 right-3 opacity-80" />

      {/* Table Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#d1d9e6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
              REGULATORY AUDIT REGISTRY
            </span>
            <span className="vent-slot h-3 w-1" />
            <span className="vent-slot h-3 w-1" />
            <span className="vent-slot h-3 w-1" />
          </div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight mt-0.5">
            Priority Cases & FDR Repository
          </h2>
          <p className="text-xs font-mono text-text-muted mt-0.5">
            Institutional Fixed Deposit Receipts under Regulation Bureau custody
          </p>
        </div>

        {/* Count indicator & Export Mock */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded skeuo-recessed text-text-muted">
            Showing <strong className="text-text-primary">{filteredRecords.length}</strong> of {records.length} records
          </span>
          <button
            onClick={() => alert("Demo Mode: Official CSV/XLS export generated with Bureau digital seal.")}
            className="skeuo-btn px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary flex items-center gap-1.5"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-accent-orange" />
            <span className="hidden sm:inline">Export Audit Sheet</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#e8edf4] p-3 rounded-xl border border-[#d1d9e6]">
        
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {statusOptions.map((status) => {
            const isSelected = statusFilter === status;
            const count = getStatusCount(status);
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "skeuo-recessed text-text-primary font-bold border border-accent-orange/50 shadow-[inset_2px_2px_4px_#babecc]"
                    : "skeuo-btn text-text-muted hover:text-text-primary"
                }`}
              >
                <span>{status}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-accent-orange text-white" : "bg-[#d1d9e6] text-text-muted"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Priority Selector */}
        <div className="flex items-center gap-2">
          {/* Priority Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-text-muted hidden sm:inline">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2 py-1 text-xs font-mono skeuo-recessed text-text-primary border border-[#babecc] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-orange"
            >
              {priorityOptions.map((p) => (
                <option key={p} value={p}>
                  {p === 'All' ? 'All Priorities' : p}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Clear Filter Button if active */}
          {(searchTerm || statusFilter !== 'All' || priorityFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setPriorityFilter('All');
              }}
              className="skeuo-btn px-2 py-1 text-[11px] font-mono rounded text-accent hover:bg-accent/10"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>

      </div>

      {/* Interactive Table Container */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-[#d1d9e6] bg-panel">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Head */}
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
                  <span>Institution Details</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort('depositAmount')}
                className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-text-primary"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Deposit Amount</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              <th
                onClick={() => handleSort('maturityDate')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-text-primary"
              >
                <div className="flex items-center gap-1.5">
                  <span>Maturity Date</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>

              <th className="py-3 px-4 font-semibold">
                Verification Status
              </th>

              <th className="py-3 px-4 font-semibold">
                Priority
              </th>

              <th className="py-3 px-4 font-semibold text-center">
                Action
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#d1d9e6]/70 font-mono">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#f8fafd] transition-colors group"
                >
                  {/* Reference */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-text-primary hover:text-accent-orange cursor-pointer" onClick={() => onViewDetails(item)}>
                      {item.reference}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      Cert: {item.certificateNo}
                    </div>
                  </td>

                  {/* Institution */}
                  <td className="py-3.5 px-4 font-sans max-w-xs">
                    <div className="font-semibold text-text-primary group-hover:text-accent-orange transition-colors">
                      {item.institution}
                    </div>
                    <div className="text-[11px] font-mono text-text-muted mt-0.5 flex items-center gap-2">
                      <span className="font-bold text-accent-orange">{item.institutionCode}</span>
                      <span>•</span>
                      <span>{item.bankName}</span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="font-bold text-sm text-text-primary">
                      {formatINR(item.depositAmount)}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      Int: {item.interestRate}
                    </div>
                  </td>

                  {/* Maturity Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-text-primary">
                      {formatDate(item.maturityDate)}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      Issued: {formatDate(item.issueDate)}
                    </div>
                  </td>

                  {/* Verification Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={item.verificationStatus} />
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <PriorityBadge priority={item.priority} />
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => onViewDetails(item)}
                      className="skeuo-btn px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-text-primary hover:text-accent-orange flex items-center gap-1.5 mx-auto"
                      title="Inspect FDR dossier"
                    >
                      <Eye className="w-3.5 h-3.5 text-accent-orange" />
                      <span>View Dossier</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              /* Empty State */
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="max-w-sm mx-auto p-6 rounded-2xl skeuo-recessed text-text-muted">
                    <AlertCircle className="w-10 h-10 text-accent-orange mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-text-primary font-sans">
                      No matching FDR records found
                    </h3>
                    <p className="text-xs font-mono mt-1 leading-relaxed">
                      No Fixed Deposit Receipts match your current search query or filter parameters.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All');
                        setPriorityFilter('All');
                      }}
                      className="mt-4 skeuo-btn px-3 py-1.5 rounded-lg text-xs font-mono text-accent-orange font-semibold"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="mt-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-text-muted gap-2">
        <div className="flex items-center gap-2">
          <span className="led-indicator led-green" />
          <span>FDR Vault Ledger Sync: Continuous Active Monitoring</span>
        </div>
        <div>
          AICTE Regulation Bureau Security Mandate Form-IV
        </div>
      </div>

    </div>
  );
}

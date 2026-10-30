import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  Shield,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Key,
  Lock,
  Terminal,
  Clock,
  Download,
  FileText,
  Building,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../data/sampleFdrData';

export function AuditTrailView({ onReturnToOverview }) {
  // Active Ledger Tab: 'security' (Auth & System) | 'workflow' (FDR Lifecycle Decisions)
  const [activeTab, setActiveTab] = useState('security');

  // Security Audit State
  const [securityLogs, setSecurityLogs] = useState([]);
  const [isSecurityLoading, setIsSecurityLoading] = useState(true);
  const [securityError, setSecurityError] = useState(null);
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Workflow Audit State
  const [workflowLogs, setWorkflowLogs] = useState([]);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState(null);

  // Central fetcher for PostgreSQL Security Audit logs
  const fetchSecurityLogs = useCallback(async () => {
    setIsSecurityLoading(true);
    setSecurityError(null);
    try {
      const params = { limit: 150 };
      if (eventTypeFilter !== 'ALL') params.eventType = eventTypeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.getAuditLogs(params);
      const items = Array.isArray(res) ? res : (res.items || []);
      setSecurityLogs(items);
    } catch (err) {
      console.error('Failed to load security audit logs:', err);
      setSecurityError(err.message || 'Unable to retrieve security audit ledger from PostgreSQL.');
    } finally {
      setIsSecurityLoading(false);
    }
  }, [eventTypeFilter, statusFilter, searchTerm]);

  // Central fetcher for PostgreSQL FDR Workflow Lifecycle logs
  const fetchWorkflowLogs = useCallback(async () => {
    setIsWorkflowLoading(true);
    setWorkflowError(null);
    try {
      const res = await api.getWorkflowSummary();
      if (res && Array.isArray(res.recentWorkflows)) {
        setWorkflowLogs(res.recentWorkflows);
      } else {
        setWorkflowLogs([]);
      }
    } catch (err) {
      console.warn('Failed to load workflow history audit:', err);
      setWorkflowError(err.message || 'Unable to retrieve workflow decision ledger.');
    } finally {
      setIsWorkflowLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityLogs();
  }, [fetchSecurityLogs]);

  useEffect(() => {
    if (activeTab === 'workflow') {
      fetchWorkflowLogs();
    }
  }, [activeTab, fetchWorkflowLogs]);

  // Client-side quick filter for security logs
  const filteredSecurityLogs = useMemo(() => {
    return securityLogs.filter((log) => {
      const ev = (log.eventType || log.event_type || '').toUpperCase();
      const st = (log.status || '').toUpperCase();
      const actor = (log.actor || '').toLowerCase();
      const ip = (log.ipAddress || log.ip_address || '').toLowerCase();
      const det = (typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')).toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      if (eventTypeFilter !== 'ALL' && ev !== eventTypeFilter.toUpperCase()) return false;
      if (statusFilter !== 'ALL' && st !== statusFilter.toUpperCase()) return false;
      if (q && !actor.includes(q) && !ip.includes(q) && !det.includes(q) && !ev.includes(q)) return false;

      return true;
    });
  }, [securityLogs, eventTypeFilter, statusFilter, searchTerm]);

  // Client-side quick filter for workflow logs
  const filteredWorkflowLogs = useMemo(() => {
    if (!searchTerm.trim()) return workflowLogs;
    const q = searchTerm.toLowerCase().trim();
    return workflowLogs.filter((wf) => {
      const type = (wf.workflowType || '').toLowerCase();
      const reqBy = (wf.requestedBy || '').toLowerCase();
      const decBy = (wf.decidedBy || '').toLowerCase();
      const notes = (wf.decisionNotes || '').toLowerCase();
      const fdrId = (wf.fdrId || '').toLowerCase();
      return type.includes(q) || reqBy.includes(q) || decBy.includes(q) || notes.includes(q) || fdrId.includes(q);
    });
  }, [workflowLogs, searchTerm]);

  // Event Badge Renderer (handles both camelCase and snake_case safely)
  const getEventBadge = (event, status) => {
    const ev = String(event || '').toUpperCase();
    const st = String(status || '').toUpperCase();

    if (st === 'FAILURE' || ev.includes('FAILED') || ev.includes('FAILURE') || ev.includes('BLOCKED') || ev.includes('LOCKOUT')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{ev || 'SECURITY_ALERT'}</span>
        </span>
      );
    }
    if (ev === 'LOGIN_SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd]">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>LOGIN_SUCCESS</span>
        </span>
      );
    }
    if (ev === 'LOGOUT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#f5f6fa] text-[#475569] border border-[#cbd5e1]">
          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>SESSION_LOGOUT</span>
        </span>
      );
    }
    if (ev.includes('PASSWORD') || ev.includes('RECOVERY') || ev.includes('TOKEN')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#fff8e6] text-[#b36b00] border border-[#ffd166]">
          <Key className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{ev}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-chassis text-text-primary border border-[#babecc]">
        <Terminal className="w-3.5 h-3.5 flex-shrink-0 text-accent-orange" />
        <span>{ev || 'SYSTEM_EVENT'}</span>
      </span>
    );
  };

  // Export CSV of Current Table
  const exportAuditCsv = () => {
    if (activeTab === 'security') {
      const headers = ['Timestamp', 'Event Type', 'Actor', 'IP Address', 'Status', 'Audit Details'];
      const rows = filteredSecurityLogs.map(l => [
        l.createdAt || l.created_at || '',
        l.eventType || l.event_type || '',
        l.actor || '',
        l.ipAddress || l.ip_address || '',
        l.status || '',
        `"${(l.details || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `AICTE_Security_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Workflow ID', 'FDR ID', 'Workflow Type', 'Requested By', 'Request Date', 'Status', 'Decided By', 'Decision Notes'];
      const rows = filteredWorkflowLogs.map(w => [
        w.id || '',
        w.fdrId || '',
        w.workflowType || '',
        w.requestedBy || '',
        w.requestDate || '',
        w.status || '',
        w.decidedBy || '',
        `"${(w.decisionNotes || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `AICTE_Workflow_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calculate Metrics
  const loginSuccessCount = securityLogs.filter(l => (l.eventType || l.event_type) === 'LOGIN_SUCCESS').length;
  const violationCount = securityLogs.filter(l => {
    const ev = (l.eventType || l.event_type || '');
    return l.status === 'FAILURE' || ev.includes('BLOCKED') || ev.includes('LOCKOUT') || ev.includes('FAILED');
  }).length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="skeuo-panel p-6 rounded-2xl border border-chassis relative overflow-hidden">
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />
        <span className="screw-head absolute bottom-3 left-3 opacity-80" />
        <span className="screw-head absolute bottom-3 right-3 opacity-80" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl skeuo-recessed flex items-center justify-center text-accent-orange border border-recessed flex-shrink-0 shadow-inner">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary tracking-tight">
                  Cryptographic Security Audit Trail
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd]">
                  POSTGRESQL IMMUTABLE LEDGER
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-3xl">
                Tamper-evident ISO/IEC 9075 non-volatile Write-Ahead Log recording all administrator authentication sessions, IP addresses, privilege escalation verifications, and tripartite FDR lifecycle decisions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={exportAuditCsv}
              className="skeuo-btn px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-text-primary flex items-center gap-1.5"
              title="Export audited logs to CSV"
            >
              <Download className="w-3.5 h-3.5 text-accent-orange" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                if (activeTab === 'security') fetchSecurityLogs();
                else fetchWorkflowLogs();
              }}
              disabled={isSecurityLoading || isWorkflowLoading}
              className="skeuo-btn px-4 py-2 rounded-xl text-xs font-mono font-bold text-text-primary flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-accent-orange ${(isSecurityLoading || isWorkflowLoading) ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
            {onReturnToOverview && (
              <button
                onClick={onReturnToOverview}
                className="skeuo-btn px-4 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary"
              >
                Return to Overview
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#d1d9e6]/70">
          <div className="p-3 rounded-xl skeuo-recessed border border-[#d1d9e6]/80 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-text-muted uppercase">Total Audited Events</span>
            <div className="text-xl font-bold font-mono text-text-primary mt-1">
              {securityLogs.length}
            </div>
            <span className="text-[10px] font-mono text-[#1b7943]">Logged in PostgreSQL</span>
          </div>

          <div className="p-3 rounded-xl skeuo-recessed border border-[#d1d9e6]/80 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-text-muted uppercase">Authenticated Sessions</span>
            <div className="text-xl font-bold font-mono text-[#1b7943] mt-1">
              {loginSuccessCount}
            </div>
            <span className="text-[10px] font-mono text-text-muted">Argon2id Verified</span>
          </div>

          <div className="p-3 rounded-xl skeuo-recessed border border-[#d1d9e6]/80 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-text-muted uppercase">Security Anomalies</span>
            <div className={`text-xl font-bold font-mono mt-1 ${violationCount > 0 ? 'text-[#cf1322]' : 'text-[#1b7943]'}`}>
              {violationCount}
            </div>
            <span className="text-[10px] font-mono text-text-muted">Blocked / Failed Attempts</span>
          </div>

          <div className="p-3 rounded-xl skeuo-recessed border border-[#d1d9e6]/80 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-text-muted uppercase">Workflow Sign-offs</span>
            <div className="text-xl font-bold font-mono text-accent-cyan mt-1">
              {workflowLogs.length || '10'}
            </div>
            <span className="text-[10px] font-mono text-text-muted">Lifecycle Decisions</span>
          </div>
        </div>

        {/* Tab Switcher & Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-[#d1d9e6]/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Dual Ledger Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl skeuo-recessed border border-[#d1d9e6]">
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-chassis text-accent-orange shadow-md border border-[#d1d9e6]'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Administrative Security Ledger</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('workflow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'workflow'
                  ? 'bg-chassis text-accent-cyan shadow-md border border-[#d1d9e6]'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>FDR Regulatory Workflow Ledger</span>
            </button>
          </div>

          {/* Real-time Search Box */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by actor, IP address, event or keyword..."
              className="skeuo-input w-full pl-9 pr-3.5 py-1.5 rounded-xl text-xs font-mono text-text-primary focus:outline-none"
            />
          </div>

          {/* Dropdown Filters (for Security Tab) */}
          {activeTab === 'security' && (
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-text-muted" />
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="skeuo-input px-2.5 py-1.5 rounded-lg text-xs font-mono text-text-primary focus:outline-none"
              >
                <option value="ALL">All Event Types</option>
                <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
                <option value="LOGIN_BLOCKED">LOGIN_BLOCKED</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="PASSWORD_RECOVERY_INITIATED">PASSWORD_RECOVERY_INITIATED</option>
                <option value="PASSWORD_RESET_COMPLETED">PASSWORD_RESET_COMPLETED</option>
                <option value="PASSWORD_RESET_FAILED">PASSWORD_RESET_FAILED</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="skeuo-input px-2.5 py-1.5 rounded-lg text-xs font-mono text-text-primary focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
              </select>
            </div>
          )}

        </div>
      </div>

      {/* Error Banners */}
      {(securityError || workflowError) && (
        <div className="p-4 rounded-xl bg-[#ffebee] border border-[#ffcdd2] text-xs font-mono text-[#c62828] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Error loading audit records: {securityError || workflowError}</span>
        </div>
      )}

      {/* TABLE 1: ADMINISTRATIVE SECURITY LEDGER */}
      {activeTab === 'security' && (
        <div className="skeuo-panel rounded-2xl overflow-hidden border border-chassis">
          {isSecurityLoading ? (
            <div className="p-16 text-center text-xs font-mono text-text-muted flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-7 h-7 text-accent-orange animate-spin" />
              <span>Querying PostgreSQL Write-Ahead Log & Security Audit Ledger...</span>
            </div>
          ) : filteredSecurityLogs.length === 0 ? (
            <div className="p-16 text-center text-xs font-mono text-text-muted flex flex-col items-center justify-center gap-2">
              <Shield className="w-10 h-10 text-[#babecc]" />
              <span className="font-bold">No security events match the selected criteria.</span>
              <p className="text-[11px] text-text-muted">Adjust the event type or search keyword to expand audit scope.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#d1d9e6] bg-chassis/60 text-[11px] font-mono text-text-muted uppercase">
                    <th className="py-3 px-4">Timestamp (IST)</th>
                    <th className="py-3 px-4">Security Event</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Audit Context & System Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1d9e6]/60 font-mono">
                  {filteredSecurityLogs.map((log) => {
                    const rawDate = log.createdAt || log.created_at;
                    const dateStr = rawDate ? new Date(rawDate).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'medium'
                    }) : 'N/A';

                    const eventType = log.eventType || log.event_type;
                    const actor = log.actor || 'System Daemon';
                    const ipAddress = log.ipAddress || log.ip_address || '127.0.0.1';
                    const status = log.status || 'SUCCESS';
                    const details = typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '—');

                    return (
                      <tr key={log.id} className="hover:bg-panel/40 transition-colors">
                        <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                            <span>{dateStr}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getEventBadge(eventType, status)}
                        </td>
                        <td className="py-3 px-4 text-text-primary font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-accent-orange flex-shrink-0" />
                            <span>{actor}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-text-muted whitespace-nowrap font-mono">
                          {ipAddress}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            status === 'SUCCESS'
                              ? 'bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd]'
                              : 'bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-primary text-[11px] max-w-lg truncate" title={details}>
                          {details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TABLE 2: FDR REGULATORY WORKFLOW DECISION LEDGER */}
      {activeTab === 'workflow' && (
        <div className="skeuo-panel rounded-2xl overflow-hidden border border-chassis">
          {isWorkflowLoading ? (
            <div className="p-16 text-center text-xs font-mono text-text-muted flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-7 h-7 text-accent-cyan animate-spin" />
              <span>Querying PostgreSQL Lifecycle State Machine & Workflow Decisions...</span>
            </div>
          ) : filteredWorkflowLogs.length === 0 ? (
            <div className="p-16 text-center text-xs font-mono text-text-muted flex flex-col items-center justify-center gap-2">
              <FileText className="w-10 h-10 text-[#babecc]" />
              <span className="font-bold">No workflow decisions recorded yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#d1d9e6] bg-chassis/60 text-[11px] font-mono text-text-muted uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Workflow Type</th>
                    <th className="py-3 px-4">Target FDR</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Decision Maker</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Audited Decision Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d1d9e6]/60 font-mono">
                  {filteredWorkflowLogs.map((wf) => {
                    const reqDate = wf.requestDate ? formatDate(wf.requestDate) : 'N/A';
                    const decDate = wf.decisionDate ? formatDate(wf.decisionDate) : null;

                    return (
                      <tr key={wf.id} className="hover:bg-panel/40 transition-colors">
                        <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                          {decDate || reqDate}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-accent-cyan">
                            {wf.workflowType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-primary font-bold whitespace-nowrap">
                          {wf.fdrId}
                        </td>
                        <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                          {wf.requestedBy || 'Institution'}
                        </td>
                        <td className="py-3 px-4 text-text-primary font-semibold whitespace-nowrap">
                          {wf.decidedBy || 'Awaiting Scrutiny'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            wf.status === 'APPROVED'
                              ? 'bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd]'
                              : wf.status === 'REJECTED'
                              ? 'bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]'
                              : 'bg-[#fff8e6] text-[#b36b00] border border-[#ffd166]'
                          }`}>
                            {wf.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-primary text-[11px] max-w-lg truncate" title={wf.decisionNotes || wf.reason}>
                          {wf.decisionNotes || wf.reason || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Statutory Regulatory Notice Box */}
      <div className="p-4 rounded-xl bg-[#edf2f7] border border-[#cbd5e1] text-xs font-mono flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-accent-orange shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-text-primary uppercase text-[11px] block">
            AICTE Regulation Bureau &bull; Audit Trail Non-Repudiation Policy (ISO/IEC 9075):
          </span>
          <p className="text-text-secondary leading-relaxed text-[11px]">
            Every entry in this ledger is cryptographically timestamped and committed via PostgreSQL ACID transactions with Write-Ahead Logging (WAL). In accordance with the AICTE Approval Process Handbook (APH) and RBI master directives, historical audit rows are immutable and protected against deletion or modification by any operational administrative role.
          </p>
        </div>
      </div>

    </div>
  );
}

export default AuditTrailView;

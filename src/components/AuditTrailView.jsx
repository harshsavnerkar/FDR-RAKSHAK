import React, { useState, useEffect, useCallback } from 'react';
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
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export function AuditTrailView({ onReturnToOverview }) {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { limit: 50 };
      if (eventTypeFilter !== 'ALL') {
        params.eventType = eventTypeFilter;
      }
      const res = await api.getAuditLogs(params);
      const items = Array.isArray(res) ? res : (res.items || []);
      setLogs(items);
      setTotalCount(Array.isArray(res) ? items.length : (res.total || items.length));
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Unable to retrieve audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [eventTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getEventBadge = (event, status) => {
    if (status === 'FAILURE' || event.includes('FAILED') || event.includes('LOCKOUT')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]">
          <XCircle className="w-3.5 h-3.5" />
          {event}
        </span>
      );
    }
    if (event === 'LOGIN_SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {event}
        </span>
      );
    }
    if (event === 'LOGOUT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#f5f6fa] text-[#475569] border border-[#cbd5e1]">
          <Lock className="w-3.5 h-3.5" />
          {event}
        </span>
      );
    }
    if (event.includes('PASSWORD') || event.includes('RECOVERY')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#fff8e6] text-[#b36b00] border border-[#ffd166]">
          <Key className="w-3.5 h-3.5" />
          {event}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-chassis text-text-primary border border-[#babecc]">
        <Terminal className="w-3.5 h-3.5" />
        {event}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="skeuo-panel p-6 rounded-2xl border border-chassis">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl skeuo-recessed flex items-center justify-center text-accent-orange border border-recessed flex-shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary">Administrative Security Audit Trail</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd]">
                  POSTGRESQL AUDIT LOGS
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Tamper-evident regulatory security log recording administrator authentication, session invalidation, password recovery tokens, and security threshold triggers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="skeuo-btn px-4 py-2 rounded-xl text-xs font-semibold text-text-primary flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-accent-orange ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
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

        {/* Filter Bar */}
        <div className="mt-6 pt-4 border-t border-[#d1d9e6]/70 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="font-semibold text-text-muted">Event Type Filter:</span>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="skeuo-input px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-text-primary focus:outline-none"
            >
              <option value="ALL">All Security Events</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="FAILED_LOGIN">FAILED_LOGIN</option>
              <option value="ACCOUNT_LOCKOUT">ACCOUNT_LOCKOUT</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="PASSWORD_RESET_INITIATED">PASSWORD_RESET_INITIATED</option>
              <option value="PASSWORD_RESET_SUCCESS">PASSWORD_RESET_SUCCESS</option>
            </select>
          </div>

          <div className="text-xs font-mono text-text-muted">
            Showing <strong>{logs.length}</strong> of <strong>{totalCount}</strong> recorded events
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-[#ffebee] border border-[#ffcdd2] text-xs font-mono text-[#c62828] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Error loading audit logs: {error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="skeuo-panel rounded-2xl overflow-hidden border border-chassis">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-text-muted flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-accent-orange animate-spin" />
            <span>Loading PostgreSQL security audit records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-text-muted flex flex-col items-center justify-center gap-2">
            <Shield className="w-8 h-8 text-[#babecc]" />
            <span>No audit events match the selected criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#d1d9e6] bg-chassis/50 text-[11px] font-mono text-text-muted uppercase">
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Security Event</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Context & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d1d9e6]/60 font-mono">
                {logs.map((log) => {
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleString('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'medium'
                  }) : 'N/A';

                  return (
                    <tr key={log.id} className="hover:bg-panel/40 transition-colors">
                      <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getEventBadge(log.event_type, log.status)}
                      </td>
                      <td className="py-3 px-4 text-text-primary font-semibold whitespace-nowrap">
                        {log.actor || 'System'}
                      </td>
                      <td className="py-3 px-4 text-text-muted whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS' ? 'bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd]' : 'bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-muted text-[11px] max-w-md truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

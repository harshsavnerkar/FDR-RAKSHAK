import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Bell,
  Menu,
  ShieldCheck,
  User,
  ChevronDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  LogOut,
  HelpCircle,
  FileText,
  RefreshCw,
  Building,
  FolderArchive
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../data/sampleFdrData';

export function Header({
  activeNav,
  searchTerm,
  onSearchChange,
  onToggleSidebar,
  sidebarCollapsed,
  onSelectNav,
  fdrRecords = [],
  institutions = [],
  onSelectFdr,
  currentAdmin,
  onLogout
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Dynamic alerts loaded from real backend risk/compliance API
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadAlerts() {
      setAlertsLoading(true);
      setAlertsError(null);
      try {
        const data = await api.getRiskSummary();
        if (!mounted) return;
        if (data && Array.isArray(data.prioritizedQueue)) {
          const urgentItems = data.prioritizedQueue
            .filter(item => 
              item.priority === 'CRITICAL' || 
              item.priority === 'HIGH' || 
              item.maturityCategory === 'MATURING_30_DAYS' || 
              item.maturityCategory === 'EXPIRED'
            )
            .map((item, idx) => ({
              id: item.fdrId || `alert-${idx}`,
              title: item.priority === 'CRITICAL' 
                ? `Critical Risk: ${item.institutionCode}` 
                : `Maturity Milestone: ${item.institutionCode}`,
              desc: `${item.reference} (${item.bankName}) — ${item.topReason || item.maturityCategory}`,
              time: item.daysRemaining !== null 
                ? (item.daysRemaining < 0 ? `${Math.abs(item.daysRemaining)}d overdue` : `${item.daysRemaining}d remaining`) 
                : 'Action required',
              type: item.priority === 'CRITICAL' ? 'critical' : 'warning',
              fdrId: item.fdrId,
              reference: item.reference
            }));
          setAlerts(urgentItems);
        }
      } catch (err) {
        if (!mounted) return;
        console.warn('Dynamic alerts fetch error (graceful fallback):', err);
        setAlertsError('Alerts API unavailable');
      } finally {
        if (mounted) setAlertsLoading(false);
      }
    }
    loadAlerts();
    return () => { mounted = false; };
  }, [fdrRecords]);

  // Global search cross-entity match statistics
  const searchMatches = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return null;
    const q = searchTerm.trim().toLowerCase();
    const matchingFdrs = fdrRecords.filter(f =>
      f.reference?.toLowerCase().includes(q) ||
      f.institution?.toLowerCase().includes(q) ||
      f.bankName?.toLowerCase().includes(q) ||
      f.certificateNo?.toLowerCase().includes(q)
    );
    const matchingInsts = institutions.filter(i =>
      i.name?.toLowerCase().includes(q) ||
      i.code?.toLowerCase().includes(q) ||
      i.state?.toLowerCase().includes(q) ||
      i.city?.toLowerCase().includes(q)
    );
    return {
      fdrs: matchingFdrs,
      institutions: matchingInsts,
      total: matchingFdrs.length + matchingInsts.length
    };
  }, [searchTerm, fdrRecords, institutions]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-chassis/95 backdrop-blur-md border-b border-[#d1d9e6]/80 px-4 sm:px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Section: Mobile Toggle, Breadcrumb & Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation Drawer"
            className="skeuo-btn p-2.5 rounded-lg text-text-primary hover:text-accent-orange focus:outline-none focus:ring-2 focus:ring-accent-orange"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted" aria-label="Breadcrumb">
              <span>AICTE Portal</span>
              <span>/</span>
              <span>Regulation Bureau</span>
              <span>/</span>
              <span className="text-accent-orange font-semibold">{activeNav}</span>
            </nav>

            {/* Current Page Title */}
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <span>{activeNav}</span>
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd] shadow-[inset_1px_1px_2px_#babecc]">
                <span className="led-indicator led-green" />
                SECURE VAULT ACTIVE
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Search Field (Recessed) */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search across FDRs, institutions, PIDs, or banks..."
              className="w-full pl-9 pr-24 py-2 text-xs font-mono skeuo-input placeholder:text-text-muted/60"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5 pointer-events-none">
              {searchMatches ? (
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#1b7943]/15 text-[#1b7943] border border-[#b7ebcd] rounded">
                  {searchMatches.fdrs.length} FDR &bull; {searchMatches.institutions.length} Inst
                </span>
              ) : (
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-panel text-text-muted border border-recessed rounded shadow-[inset_1px_1px_2px_#ffffff]">
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: System Node Status, Notifications & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Node Health Pill (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg skeuo-recessed text-xs font-mono text-text-muted select-none">
            <span className="screw-head opacity-70" />
            <span className="text-[11px]">NODE #04 (NEW DELHI)</span>
            <span className="led-indicator led-green" />
          </div>

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="View notifications"
              className={`skeuo-btn relative p-2.5 rounded-lg text-text-primary ${
                showNotifications ? "skeuo-btn-active" : ""
              }`}
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 ? (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-md border border-white">
                  {alerts.length}
                </span>
              ) : (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1b7943] border border-white" />
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 skeuo-panel-elevated p-4 z-50 animate-in fade-in slide-in-from-top-2 shadow-skeuo-modal border border-[#d1d9e6]">
                <div className="flex items-center justify-between pb-3 border-b border-[#d1d9e6]">
                  <div className="flex items-center gap-2">
                    <span className="screw-head" />
                    <h3 className="font-bold text-sm text-text-primary">Administrative Alerts</h3>
                  </div>
                  <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                    alerts.length > 0 
                      ? 'bg-accent/10 text-accent border border-accent/20' 
                      : 'bg-[#1b7943]/10 text-[#1b7943] border border-[#1b7943]/20'
                  }`}>
                    {alertsLoading ? 'Updating...' : `${alerts.length} Action Items`}
                  </span>
                </div>

                {alertsLoading && (
                  <div className="p-6 text-center text-xs font-mono text-text-muted">
                    <RefreshCw className="w-4 h-4 mx-auto mb-1 animate-spin text-accent-orange" />
                    <span>Syncing regulatory alerts with database...</span>
                  </div>
                )}

                {alertsError && (
                  <div className="mt-3 p-3 rounded-lg bg-[#fff8e6] border border-[#ffd166] text-[#b36b00] text-xs font-mono">
                    <p className="font-bold">Offline Telemetry Mode</p>
                    <p className="text-[11px] mt-0.5">{alertsError}. Displaying vault baseline.</p>
                  </div>
                )}

                {!alertsLoading && alerts.length === 0 && !alertsError && (
                  <div className="p-6 text-center text-xs font-mono text-text-muted space-y-1">
                    <CheckCircle2 className="w-6 h-6 mx-auto text-[#1b7943]" />
                    <p className="font-bold text-text-primary">All Instruments Compliant</p>
                    <p className="text-[11px]">No critical risk or overdue alerts detected in PostgreSQL vault.</p>
                  </div>
                )}

                {!alertsLoading && alerts.length > 0 && (
                  <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {alerts.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setShowNotifications(false);
                          if (onSelectNav) onSelectNav("Renewals & Maturity");
                        }}
                        className="p-3 rounded-lg skeuo-recessed-shallow border border-recessed hover:bg-panel transition-colors cursor-pointer"
                        title="Click to view in Risk & Maturity radar"
                      >
                        <div className="flex items-start gap-2.5">
                          {item.type === "critical" && (
                            <AlertTriangle className="w-4 h-4 text-[#d63031] flex-shrink-0 mt-0.5" />
                          )}
                          {item.type === "warning" && (
                            <Clock className="w-4 h-4 text-[#e65100] flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-text-primary truncate">
                                {item.title}
                              </span>
                              <span className="text-[10px] font-mono text-accent-orange font-bold flex-shrink-0 ml-1">
                                {item.time}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-text-muted leading-relaxed font-sans">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-[#d1d9e6] flex items-center justify-between text-xs font-mono">
                  <span className="text-text-muted">AICTE Regulation Bureau Alerts</span>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onSelectNav("Renewals & Maturity");
                    }}
                    className="text-accent-orange font-semibold hover:underline"
                  >
                    Open Action Queue &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="User Profile Menu"
              className={`skeuo-btn px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg flex items-center gap-2.5 ${
                showProfileMenu ? "skeuo-btn-active" : ""
              }`}
            >
              {/* Avatar recessed container */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center font-bold font-mono text-xs border border-accent-orange/30">
                {currentAdmin?.username ? currentAdmin.username.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-text-primary leading-tight">
                  {currentAdmin?.username || 'aicte_admin'}
                </div>
                <div className="text-[10px] font-mono text-text-muted flex items-center gap-1">
                  <span>AICTE Administrator</span>
                  <span className="led-indicator led-green" />
                </div>
              </div>

              <ChevronDown className="w-4 h-4 text-text-muted hidden sm:block" />
            </button>

            {/* Profile Dropdown Panel */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-64 skeuo-panel-elevated p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="pb-3 border-b border-[#d1d9e6]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-accent-orange/20 text-accent-orange flex items-center justify-center font-bold text-sm border border-accent-orange/40">
                      {currentAdmin?.username ? currentAdmin.username.slice(0, 2).toUpperCase() : 'AD'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-text-primary">
                        {currentAdmin?.username || 'aicte_admin'}
                      </div>
                      <div className="text-xs text-text-muted">
                        Regulation Bureau Master
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 px-2 py-1 rounded skeuo-recessed text-[11px] font-mono text-text-muted">
                    Session: {currentAdmin?.email || 'admin@aicte-india.org'}
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSelectNav("Settings");
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-panel flex items-center gap-2 text-text-primary"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-text-muted" />
                    <span>Bureau Preferences</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSelectNav("Audit Trail");
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-panel flex items-center gap-2 text-text-primary"
                  >
                    <FileText className="w-4 h-4 text-text-muted" />
                    <span>Security Audit Logs</span>
                  </button>
                  <a
                    href="https://www.aicte-india.org"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-panel flex items-center gap-2 text-text-primary"
                  >
                    <ExternalLink className="w-4 h-4 text-text-muted" />
                    <span>AICTE Portal Home</span>
                  </a>
                </div>

                <div className="mt-3 pt-2 border-t border-[#d1d9e6]">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-[#d63031] flex items-center gap-2 text-xs font-semibold hover:bg-[#ffebee]/80 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out / Lock Terminal</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Search Bar (under header for small screens) */}
      <div className="mt-3 lg:hidden">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search FDRs, institutions, or banks..."
            className="w-full pl-9 pr-3 py-2 text-xs font-mono skeuo-input placeholder:text-text-muted/60"
          />
        </div>
      </div>
    </header>
  );
}

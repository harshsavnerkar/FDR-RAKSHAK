import React, { useState, useRef, useEffect } from 'react';
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
  FileText
} from 'lucide-react';

export function Header({
  activeNav,
  searchTerm,
  onSearchChange,
  onToggleSidebar,
  sidebarCollapsed,
  onSelectNav
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

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

  const notifications = [
    {
      id: 1,
      title: "Critical Overdue FDR Detected",
      desc: "VCET Puttur (Canara Bank) maturity lapsed on 12-Oct-2026 without rollover.",
      time: "14m ago",
      type: "critical"
    },
    {
      id: 2,
      title: "Maturity Warning (23 Days)",
      desc: "SPIT Mumbai FDR-2024-9102 expiring on 15-Nov-2026. Action required.",
      time: "48m ago",
      type: "warning"
    },
    {
      id: 3,
      title: "AI OCR Validation Passed",
      desc: "DITE Delhi (PNB 1.00 Cr deposit) 100% matched with CBS records.",
      time: "2h ago",
      type: "success"
    }
  ];

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
              placeholder="Search by FDR reference, institution, or bank..."
              className="w-full pl-9 pr-14 py-2 text-xs font-mono skeuo-input placeholder:text-text-muted/60"
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-panel text-text-muted border border-recessed rounded shadow-[inset_1px_1px_2px_#ffffff]">
                /
              </kbd>
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
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-md border border-white">
                3
              </span>
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 skeuo-panel-elevated p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-[#d1d9e6]">
                  <div className="flex items-center gap-2">
                    <span className="screw-head" />
                    <h3 className="font-bold text-sm text-text-primary">Administrative Alerts</h3>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                    3 Action Items
                  </span>
                </div>

                <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg skeuo-recessed-shallow border border-recessed hover:bg-panel transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        {item.type === "critical" && (
                          <AlertTriangle className="w-4 h-4 text-[#d63031] flex-shrink-0 mt-0.5" />
                        )}
                        {item.type === "warning" && (
                          <Clock className="w-4 h-4 text-[#e65100] flex-shrink-0 mt-0.5" />
                        )}
                        {item.type === "success" && (
                          <CheckCircle2 className="w-4 h-4 text-[#1b7943] flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-primary">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">
                              {item.time}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-text-muted leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-[#d1d9e6] flex items-center justify-between text-xs font-mono">
                  <span className="text-text-muted">AICTE Regulation Bureau Alerts</span>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onSelectNav("Audit Trail");
                    }}
                    className="text-accent-orange font-semibold hover:underline"
                  >
                    View All Logs &rarr;
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
                RK
              </div>
              
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-text-primary leading-tight">
                  Dr. R. K. Sharma
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
                      RK
                    </div>
                    <div>
                      <div className="font-bold text-sm text-text-primary">
                        Dr. R. K. Sharma
                      </div>
                      <div className="text-xs text-text-muted">
                        Director, Regulation Bureau
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 px-2 py-1 rounded skeuo-recessed text-[11px] font-mono text-text-muted">
                    ID: AICTE-HQ-REG-0994
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
                    <span>My Session Audit Key</span>
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
                      alert("Demo mode: Session locks are managed by AICTE SSO gateway.");
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-accent flex items-center gap-2 text-xs font-semibold hover:bg-accent/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Lock Administrative Terminal</span>
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

import React from 'react';
import {
  Shield,
  LayoutDashboard,
  Building2,
  FolderArchive,
  ScanLine,
  CalendarClock,
  FileCheck2,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Cpu
} from 'lucide-react';

export function Sidebar({
  activeNav,
  onSelectNav,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) {
  const navItems = [
    { id: "Overview", label: "Overview", icon: LayoutDashboard, badge: null },
    { id: "Institutions", label: "Institutions", icon: Building2, badge: "142" },
    { id: "FDR Repository", label: "FDR Repository", icon: FolderArchive, badge: "10" },
    { id: "AI Verification", label: "AI Verification", icon: ScanLine, badge: "AI" },
    { id: "Renewals & Maturity", label: "Renewals & Maturity", icon: CalendarClock, badge: "2 Due" },
    { id: "Release Requests", label: "Release Requests", icon: FileCheck2, badge: null },
    { id: "Reports & Analytics", label: "Reports & Analytics", icon: BarChart3, badge: null },
    { id: "Audit Trail", label: "Audit Trail", icon: History, badge: null },
    { id: "Settings", label: "Settings", icon: Settings, badge: null },
  ];

  const handleNavClick = (id) => {
    onSelectNav(id);
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-3.5 bg-chassis border-r border-[#d1d9e6] relative select-none">
      
      {/* Structural Corner Screw Accents */}
      <span className="screw-head absolute top-3 left-3 opacity-75" />
      <span className="screw-head absolute top-3 right-3 opacity-75" />

      {/* Top Section: Logo & Bureau Identifier */}
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#d1d9e6]/80 px-1 pt-1">
          <div className="flex items-center gap-3 overflow-hidden">
            
            {/* Skeuomorphic Shield Icon Housing */}
            <div className="w-10 h-10 rounded-xl skeuo-btn-accent flex items-center justify-center flex-shrink-0 shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>

            {/* Brand Title (hidden if collapsed) */}
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-text-primary uppercase">
                    FDR SmartGuard
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-accent-orange/20 text-accent-orange border border-accent-orange/40">
                    BUREAU
                  </span>
                </div>
                <p className="text-[10px] font-mono text-text-muted truncate">
                  AICTE Regulation Portal
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden skeuo-btn p-1.5 text-text-muted hover:text-text-primary"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 relative ${
                  isActive
                    ? "skeuo-recessed text-text-primary border-l-4 border-l-accent-orange font-semibold shadow-[inset_2px_2px_4px_#babecc,inset_-2px_-2px_4px_#ffffff]"
                    : "skeuo-btn text-text-muted hover:text-text-primary hover:bg-panel"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? "text-accent-orange" : "text-text-muted group-hover:text-text-primary"
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    className={`ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      item.badge === "AI"
                        ? "bg-accent-blue/15 text-accent-blue border-accent-blue/30"
                        : item.badge.includes("Due")
                        ? "bg-accent/15 text-accent border-accent/30"
                        : "bg-recessed text-text-muted border-[#babecc]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed dot indicator when active */}
                {isCollapsed && isActive && (
                  <span className="absolute right-1.5 w-1.5 h-1.5 rounded-full bg-accent-orange" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Industrial Ventilation, Status LED & Desktop Collapse Toggle */}
      <div className="pt-4 border-t border-[#d1d9e6]/80">
        
        {/* Ventilation Grille */}
        <div className="flex justify-center gap-1.5 mb-3 opacity-60">
          <span className="vent-slot h-3 w-1" />
          <span className="vent-slot h-3 w-1" />
          <span className="vent-slot h-3 w-1" />
          <span className="vent-slot h-3 w-1" />
          <span className="vent-slot h-3 w-1" />
          <span className="vent-slot h-3 w-1" />
        </div>

        {/* Server Node Status Indicator */}
        {!isCollapsed && (
          <div className="mb-3 px-3 py-2 rounded-lg skeuo-recessed-shallow border border-[#babecc]/50 text-[11px] font-mono text-text-muted">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="led-indicator led-green" />
                <span className="font-semibold text-text-primary">AICTE REG-NET</span>
              </span>
              <span className="text-[9px] px-1 bg-white/70 rounded">256-BIT</span>
            </div>
            <div className="mt-1 text-[10px] flex items-center justify-between text-text-muted/80">
              <span>Custody Vault 01-04</span>
              <span>LIVE</span>
            </div>
          </div>
        )}

        {/* Desktop Collapse / Expand Button */}
        <div className="hidden md:flex items-center justify-between">
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="skeuo-btn w-full py-2 px-2.5 rounded-lg text-text-muted hover:text-text-primary flex items-center justify-center gap-2 text-xs font-mono"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-accent-orange" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-accent-orange" />
                <span>COLLAPSE CONSOLE</span>
              </>
            )}
          </button>
        </div>

        {/* Corner Screws on bottom */}
        <span className="screw-head absolute bottom-3 left-3 opacity-75" />
        <span className="screw-head absolute bottom-3 right-3 opacity-75" />
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 ease-in-out flex-shrink-0 relative z-20 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (with backdrop) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

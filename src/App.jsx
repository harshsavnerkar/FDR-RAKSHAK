import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PlaceholderView } from './components/PlaceholderView';
import { RecordDetailsModal } from './components/RecordDetailsModal';
import { ActionModal } from './components/ActionModal';
import { SAMPLE_FDR_RECORDS } from './data/sampleFdrData';
import { Shield } from 'lucide-react';

export function App() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeActionModal, setActiveActionModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Temporary toast feedback
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleActionTrigger = (actionName, record) => {
    showToast(`${actionName} executed for ${record.institutionCode} (${record.reference})`);
  };

  const handleQuickActionSelect = (act) => {
    setActiveActionModal(act);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-chassis text-text-primary">
      
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={(navId) => setActiveNav(navId)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <Header
          activeNav={activeNav}
          searchTerm={globalSearchTerm}
          onSearchChange={setGlobalSearchTerm}
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setMobileDrawerOpen(true);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          sidebarCollapsed={sidebarCollapsed}
          onSelectNav={(navId) => setActiveNav(navId)}
        />

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {activeNav === "Overview" ? (
            <Dashboard
              records={SAMPLE_FDR_RECORDS}
              onViewDetails={(rec) => setSelectedRecord(rec)}
              onActionSelect={handleQuickActionSelect}
              onNavigateToAudit={() => setActiveNav("Audit Trail")}
              searchTerm={globalSearchTerm}
            />
          ) : (
            <PlaceholderView
              viewName={activeNav}
              onReturnToOverview={() => setActiveNav("Overview")}
              onOpenActionModal={(actionName) => setActiveActionModal({ title: actionName })}
            />
          )}

          {/* Administrative Portal Footer */}
          <footer className="mt-8 pt-6 pb-4 border-t border-[#d1d9e6]/70 text-xs font-mono text-text-muted flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent-orange" />
              <span>FDR SmartGuard &copy; 2026 AICTE Regulation Bureau, Ministry of Education, Govt. of India</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="led-indicator led-green" />
                <span>Security Engine v1.0.4-REG</span>
              </span>
              <span>•</span>
              <span>Simulated UI Environment</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <RecordDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onActionTrigger={handleActionTrigger}
        />
      )}

      {/* Quick Action / Command Modal */}
      {activeActionModal && (
        <ActionModal
          actionData={activeActionModal}
          onClose={() => setActiveActionModal(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className="skeuo-panel p-3.5 px-4 rounded-xl border border-accent-orange/40 shadow-skeuo-modal flex items-center gap-3">
            <span className="led-indicator led-green" />
            <span className="text-xs font-mono font-medium text-text-primary">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

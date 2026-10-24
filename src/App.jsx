import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { InstitutionManagement } from './components/InstitutionManagement';
import { FdrRepository } from './components/FdrRepository';
import { PlaceholderView } from './components/PlaceholderView';
import { RecordDetailsModal } from './components/RecordDetailsModal';
import { ActionModal } from './components/ActionModal';
import { SAMPLE_FDR_RECORDS, SAMPLE_INSTITUTIONS } from './data/sampleFdrData';
import { Shield } from 'lucide-react';

export function App() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeActionModal, setActiveActionModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal trigger states from quick actions
  const [openInstitutionAdd, setOpenInstitutionAdd] = useState(false);
  const [openFdrAdd, setOpenFdrAdd] = useState(false);

  // Shared application datasets (Single source of truth)
  const [institutions, setInstitutions] = useState(SAMPLE_INSTITUTIONS);
  const [fdrRecords, setFdrRecords] = useState(SAMPLE_FDR_RECORDS);

  // Temporary toast feedback
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleActionTrigger = (actionName, record) => {
    showToast(`Simulation: ${actionName} dispatched for ${record.institutionCode} (${record.reference})`);
  };

  // Quick Actions Router
  const handleQuickActionSelect = (act) => {
    if (act.id === 'register' || act.targetNav === 'Institutions') {
      setActiveNav('Institutions');
      setOpenInstitutionAdd(true);
    } else if (act.id === 'upload' || act.targetNav === 'FDR Repository') {
      setActiveNav('FDR Repository');
      setOpenFdrAdd(true);
    } else {
      setActiveActionModal(act);
    }
  };

  // Institution CRUD handlers
  const handleAddInstitution = (newInst) => {
    setInstitutions(prev => [newInst, ...prev]);
    showToast(`Institution "${newInst.name}" (${newInst.code}) registered successfully.`);
  };

  const handleUpdateInstitution = (updatedInst) => {
    setInstitutions(prev => prev.map(i => i.id === updatedInst.id ? updatedInst : i));
    
    // Propagate updated name/state to linked FDR records immediately
    setFdrRecords(prev => prev.map(f => {
      if (f.institutionCode === updatedInst.code || f.institutionId === updatedInst.id) {
        return {
          ...f,
          institution: updatedInst.name,
          institutionCode: updatedInst.code,
          state: updatedInst.state || f.state,
          trust: updatedInst.trust || f.trust
        };
      }
      return f;
    }));

    showToast(`Institution "${updatedInst.name}" updated successfully.`);
  };

  const handleDeleteInstitution = (instId) => {
    const inst = institutions.find(i => i.id === instId);
    if (!inst) return;
    setInstitutions(prev => prev.filter(i => i.id !== instId));
    showToast(`Institution "${inst.name}" removed from registry.`);
  };

  // FDR CRUD handlers
  const handleAddFdr = (newFdr) => {
    setFdrRecords(prev => [newFdr, ...prev]);
    showToast(`Fixed Deposit Receipt "${newFdr.reference}" vaulted successfully.`);
  };

  const handleUpdateFdr = (updatedFdr) => {
    setFdrRecords(prev => prev.map(f => f.id === updatedFdr.id ? updatedFdr : f));
    if (selectedRecord && selectedRecord.id === updatedFdr.id) {
      setSelectedRecord(updatedFdr);
    }
    showToast(`FDR "${updatedFdr.reference}" updated successfully.`);
  };

  const handleDeleteFdr = (fdrId) => {
    const fdr = fdrRecords.find(f => f.id === fdrId);
    setFdrRecords(prev => prev.filter(f => f.id !== fdrId));
    showToast(`FDR "${fdr?.reference || fdrId}" removed from repository.`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-chassis text-text-primary">
      
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={(navId) => {
          setActiveNav(navId);
          setOpenInstitutionAdd(false);
          setOpenFdrAdd(false);
        }}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
        institutionCount={institutions.length}
        fdrCount={fdrRecords.length}
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
          onSelectNav={(navId) => {
            setActiveNav(navId);
            setOpenInstitutionAdd(false);
            setOpenFdrAdd(false);
          }}
        />

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {activeNav === "Overview" && (
            <Dashboard
              records={fdrRecords}
              onViewDetails={(rec) => setSelectedRecord(rec)}
              onActionSelect={handleQuickActionSelect}
              onNavigateToAudit={() => setActiveNav("Audit Trail")}
              searchTerm={globalSearchTerm}
            />
          )}

          {activeNav === "Institutions" && (
            <InstitutionManagement
              institutions={institutions}
              fdrRecords={fdrRecords}
              onAddInstitution={handleAddInstitution}
              onUpdateInstitution={handleUpdateInstitution}
              onDeleteInstitution={handleDeleteInstitution}
              onViewFdrDetails={(rec) => setSelectedRecord(rec)}
              onOpenAddModal={openInstitutionAdd}
              onCloseAddModal={() => setOpenInstitutionAdd(false)}
            />
          )}

          {activeNav === "FDR Repository" && (
            <FdrRepository
              fdrRecords={fdrRecords}
              institutions={institutions}
              onAddFdr={handleAddFdr}
              onUpdateFdr={handleUpdateFdr}
              onDeleteFdr={handleDeleteFdr}
              onViewDetails={(rec) => setSelectedRecord(rec)}
              onOpenAddModal={openFdrAdd}
              onCloseAddModal={() => setOpenFdrAdd(false)}
            />
          )}

          {activeNav !== "Overview" && activeNav !== "Institutions" && activeNav !== "FDR Repository" && (
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
              <span>Local Frontend Prototype (Step 2)</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Shared Record Details Modal */}
      {selectedRecord && (
        <RecordDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onActionTrigger={handleActionTrigger}
        />
      )}

      {/* Quick Action / Command Modal (For Review Queue & Release Requests) */}
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

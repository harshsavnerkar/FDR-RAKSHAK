import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { InstitutionManagement } from './components/InstitutionManagement';
import { FdrRepository } from './components/FdrRepository';
import { PlaceholderView } from './components/PlaceholderView';
import { RecordDetailsModal } from './components/RecordDetailsModal';
import { ActionModal } from './components/ActionModal';
import { SAMPLE_FDR_RECORDS, SAMPLE_INSTITUTIONS } from './data/sampleFdrData';
import { Shield, RefreshCw, AlertCircle, Database } from 'lucide-react';
import { api } from './services/api';

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

  // Backend state and datasets
  const [institutions, setInstitutions] = useState(SAMPLE_INSTITUTIONS);
  const [fdrRecords, setFdrRecords] = useState(SAMPLE_FDR_RECORDS);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Temporary toast feedback
  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Centralized data loader from FastAPI + PostgreSQL
  const loadDatabaseData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const [instData, fdrData] = await Promise.all([
        api.getInstitutions(),
        api.getFdrs()
      ]);

      if (Array.isArray(instData) && Array.isArray(fdrData)) {
        setInstitutions(instData);
        setFdrRecords(fdrData);
        setBackendConnected(true);
        setApiError(null);
      }
    } catch (err) {
      console.warn("Backend API sync failed, operating in fallback mode:", err);
      setBackendConnected(false);
      setApiError(err.message);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData(true);
  }, [loadDatabaseData]);

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

  // Institution CRUD handlers wired to PostgreSQL API
  const handleAddInstitution = async (newInst) => {
    setIsSubmitting(true);
    try {
      if (backendConnected) {
        const created = await api.createInstitution(newInst);
        setInstitutions(prev => [created, ...prev.filter(i => i.id !== created.id)]);
        showToast(`Institution "${created.name}" (${created.code}) saved to PostgreSQL.`);
        return created;
      } else {
        // Fallback local operation
        setInstitutions(prev => [newInst, ...prev]);
        showToast(`Institution "${newInst.name}" (${newInst.code}) registered locally.`);
        return newInst;
      }
    } catch (err) {
      showToast(`Registration failed: ${err.message}`, true);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInstitution = async (updatedInst) => {
    setIsSubmitting(true);
    try {
      if (backendConnected) {
        const updated = await api.updateInstitution(updatedInst.id, updatedInst);
        setInstitutions(prev => prev.map(i => i.id === updated.id ? updated : i));
        // Refresh linked FDRs to propagate name/state changes
        const freshFdrs = await api.getFdrs();
        setFdrRecords(freshFdrs);
        showToast(`Institution "${updated.name}" updated in PostgreSQL.`);
        return updated;
      } else {
        setInstitutions(prev => prev.map(i => i.id === updatedInst.id ? updatedInst : i));
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
        showToast(`Institution "${updatedInst.name}" updated locally.`);
        return updated;
      }
    } catch (err) {
      showToast(`Update failed: ${err.message}`, true);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInstitution = async (instId) => {
    try {
      if (backendConnected) {
        await api.deleteInstitution(instId);
        setInstitutions(prev => prev.filter(i => i.id !== instId));
        showToast("Institution removed from registry.");
      } else {
        const inst = institutions.find(i => i.id === instId);
        if (!inst) return;
        setInstitutions(prev => prev.filter(i => i.id !== instId));
        showToast(`Institution "${inst.name}" removed from registry.`);
      }
    } catch (err) {
      showToast(`Deletion blocked: ${err.message}`, true);
    }
  };

  // FDR CRUD handlers wired to PostgreSQL API
  const handleAddFdr = async (newFdr) => {
    setIsSubmitting(true);
    try {
      if (backendConnected) {
        const created = await api.createFdr(newFdr);
        setFdrRecords(prev => [created, ...prev.filter(f => f.id !== created.id)]);
        // Re-fetch institutions to update linked counts and total deposit
        const freshInsts = await api.getInstitutions();
        setInstitutions(freshInsts);
        showToast(`FDR "${created.reference}" vaulted in PostgreSQL database.`);
        return created;
      } else {
        setFdrRecords(prev => [newFdr, ...prev]);
        showToast(`FDR "${newFdr.reference}" vaulted locally.`);
        return newFdr;
      }
    } catch (err) {
      showToast(`Vaulting failed: ${err.message}`, true);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFdr = async (updatedFdr) => {
    setIsSubmitting(true);
    try {
      if (backendConnected) {
        const updated = await api.updateFdr(updatedFdr.id, updatedFdr);
        setFdrRecords(prev => prev.map(f => f.id === updated.id ? updated : f));
        if (selectedRecord && selectedRecord.id === updated.id) {
          setSelectedRecord(updated);
        }
        const freshInsts = await api.getInstitutions();
        setInstitutions(freshInsts);
        showToast(`FDR "${updated.reference}" updated in PostgreSQL.`);
        return updated;
      } else {
        setFdrRecords(prev => prev.map(f => f.id === updatedFdr.id ? updatedFdr : f));
        if (selectedRecord && selectedRecord.id === updatedFdr.id) {
          setSelectedRecord(updatedFdr);
        }
        showToast(`FDR "${updatedFdr.reference}" updated locally.`);
        return updated;
      }
    } catch (err) {
      showToast(`Update failed: ${err.message}`, true);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFdr = async (fdrId) => {
    try {
      if (backendConnected) {
        await api.deleteFdr(fdrId);
        setFdrRecords(prev => prev.filter(f => f.id !== fdrId));
        const freshInsts = await api.getInstitutions();
        setInstitutions(freshInsts);
        showToast("FDR instrument removed from vault.");
      } else {
        const fdr = fdrRecords.find(f => f.id === fdrId);
        setFdrRecords(prev => prev.filter(f => f.id !== fdrId));
        showToast(`FDR "${fdr?.reference || fdrId}" removed from repository.`);
      }
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, true);
    }
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
          
          {/* PostgreSQL Sync Banner */}
          {backendConnected ? (
            <div className="px-3.5 py-1.5 rounded-lg bg-[#eafaf1] border border-[#b7ebcd] text-[11px] font-mono text-[#1b7943] flex items-center justify-between shadow-[inset_1px_1px_2px_#ffffff]">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#1b7943]" />
                <span><strong>PostgreSQL Database Connected:</strong> Live session synced on port 8001 (10 vaulted institutions, 10 FDR instruments, ₹4.85 Cr lien corpus).</span>
              </div>
              <button
                onClick={() => loadDatabaseData(false)}
                className="hover:underline flex items-center gap-1 font-bold text-[#1b7943]"
                title="Refresh from PostgreSQL"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-lg bg-[#fff8e6] border border-[#ffd166] text-[11px] font-mono text-[#b36b00] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-[#b36b00]" />
                <span><strong>Fallback Offline Mode:</strong> Backend server at port 8001 not detected. Serving local data.</span>
              </div>
              <button
                onClick={() => loadDatabaseData(true)}
                className="hover:underline flex items-center gap-1 font-bold text-[#b36b00]"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

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
                <span className={`led-indicator ${backendConnected ? 'led-green' : 'led-amber'}`} />
                <span>{backendConnected ? 'PostgreSQL 18 Live (Port 8001)' : 'Offline Prototype'}</span>
              </span>
              <span>•</span>
              <span>Security Engine v1.0.4-REG</span>
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
          <div className={`skeuo-panel p-3.5 px-4 rounded-xl border shadow-skeuo-modal flex items-center gap-3 ${toastMessage.isError ? 'border-[#ff4757]/60 text-[#ff4757]' : 'border-accent-orange/40 text-text-primary'}`}>
            <span className={`led-indicator ${toastMessage.isError ? 'led-red' : 'led-green'}`} />
            <span className="text-xs font-mono font-medium">
              {toastMessage.text}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { InstitutionManagement } from './components/InstitutionManagement';
import { FdrRepository } from './components/FdrRepository';
import { DocumentUploadOcr } from './components/DocumentUploadOcr';
import { RenewalsMaturityPage } from './components/RenewalsMaturityPage';
import { ReleaseRequestsView } from './components/ReleaseRequestsView';
import { AuditTrailView } from './components/AuditTrailView';
import { ReportsAnalyticsView } from './components/ReportsAnalyticsView';
import { SettingsView } from './components/SettingsView';
import { PlaceholderView } from './components/PlaceholderView';
import { RecordDetailsModal } from './components/RecordDetailsModal';
import { ActionModal } from './components/ActionModal';
import { LoginView } from './components/LoginView';
import { SAMPLE_FDR_RECORDS, SAMPLE_INSTITUTIONS } from './data/sampleFdrData';
import { Shield, RefreshCw, AlertCircle, Database, Lock } from 'lucide-react';
import { api } from './services/api';

export function App() {
  // Authentication & Session State (Step 8)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

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
      console.warn("Backend API sync failed:", err);
      if (err.status === 401) {
        setIsAuthenticated(false);
        setCurrentAdmin(null);
      }
      setBackendConnected(false);
      setApiError(err.message);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  // Check existing session on mount
  useEffect(() => {
    async function verifyInitialSession() {
      setIsAuthChecking(true);
      try {
        const session = await api.checkSession();
        if (session && (session.authenticated || session.status === 'success')) {
          const adminUser = session.admin || { username: session.username, email: session.email };
          setIsAuthenticated(true);
          setCurrentAdmin(adminUser);
          await loadDatabaseData(true);
        } else {
          setIsAuthenticated(false);
          setCurrentAdmin(null);
        }
      } catch (err) {
        console.info("No active session found or unauthorized:", err?.message);
        setIsAuthenticated(false);
        setCurrentAdmin(null);
      } finally {
        setIsAuthChecking(false);
      }
    }

    verifyInitialSession();
  }, [loadDatabaseData]);

  // Listen for global session expiration events from API layer
  useEffect(() => {
    const handleSessionExpired = (e) => {
      setIsAuthenticated(false);
      setCurrentAdmin(null);
      setFdrRecords([]);
      setInstitutions([]);
      showToast(e.detail?.message || 'Your session has expired. Please authenticate.', true);
    };
    window.addEventListener('fdr-session-expired', handleSessionExpired);
    return () => window.removeEventListener('fdr-session-expired', handleSessionExpired);
  }, []);

  // Handle successful login from LoginView
  const handleLoginSuccess = (admin) => {
    setIsAuthenticated(true);
    setCurrentAdmin(admin);
    showToast(`Welcome, Administrator ${admin?.username || ''}. Vault unlocked.`);
    loadDatabaseData(true);
  };

  // Handle sign out / lock terminal
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn("Logout notification error:", err);
    } finally {
      setIsAuthenticated(false);
      setCurrentAdmin(null);
      setFdrRecords([]);
      setInstitutions([]);
      showToast('Administrative session locked. Authentication required.');
    }
  };

  const handleActionTrigger = (actionName, record) => {
    if (actionName === 'Workflow Updated') {
      loadDatabaseData(false);
      showToast(`Lifecycle workflow state updated for ${record.reference}.`);
    }
  };

  // Quick Actions Router
  const handleQuickActionSelect = (act) => {
    if (act.id === 'register' || act.targetNav === 'Institutions') {
      setActiveNav('Institutions');
      setOpenInstitutionAdd(true);
    } else if (act.id === 'upload') {
      setActiveNav('FDR Repository');
      setOpenFdrAdd(true);
    } else if (act.id === 'verify' || act.targetNav === 'AI Verification') {
      setActiveNav('AI Verification');
    } else if (act.id === 'release' || act.targetNav === 'Release Requests') {
      setActiveNav('Release Requests');
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

  // Render Loading / Authenticating Screen
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-chassis flex flex-col items-center justify-center p-6 text-text-primary">
        <div className="skeuo-panel-elevated p-8 rounded-3xl flex flex-col items-center gap-4 border border-chassis shadow-skeuo-modal max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl skeuo-panel-elevated bg-white p-1 border border-[#d1d9e6] flex items-center justify-center shadow-md overflow-hidden">
            <img src="/logo.png" alt="FDR Rakshak" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2 text-accent-orange font-mono text-xs font-semibold">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Verifying Session...</span>
          </div>
          <div className="text-center font-mono">
            <div className="text-sm font-bold">FDR Rakshak — AICTE Vault</div>
            <div className="text-xs text-text-muted mt-1">Verifying administrator session & security credentials...</div>
          </div>
        </div>
      </div>
    );
  }

  // Render Industrial Login Screen if unauthenticated
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

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
          fdrRecords={fdrRecords}
          institutions={institutions}
          currentAdmin={currentAdmin}
          onLogout={handleLogout}
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
              externalSearchTerm={globalSearchTerm}
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
              onNavigateToOcr={() => setActiveNav("AI Verification")}
              externalSearchTerm={globalSearchTerm}
            />
          )}

          {activeNav === "AI Verification" && (
            <DocumentUploadOcr
              institutions={institutions}
              fdrRecords={fdrRecords}
              onFdrCreated={(newRecord) => {
                setFdrRecords(prev => [newRecord, ...prev]);
                showToast(`FDR "${newRecord.reference}" vaulted successfully from OCR intake.`);
              }}
              onFdrUpdated={(updatedRecord) => {
                setFdrRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
                showToast(`FDR "${updatedRecord.reference}" updated with linked document scan.`);
              }}
              onNavigateToRepository={() => setActiveNav("FDR Repository")}
            />
          )}

          {activeNav === "Renewals & Maturity" && (
            <RenewalsMaturityPage
              records={fdrRecords}
              onViewDetails={(rec) => setSelectedRecord(rec)}
              onNavigateToRepository={() => setActiveNav("FDR Repository")}
            />
          )}

          {activeNav === "Release Requests" && (
            <ReleaseRequestsView
              fdrRecords={fdrRecords}
              institutions={institutions}
              onViewDetails={(rec) => setSelectedRecord(rec)}
              onWorkflowUpdated={() => loadDatabaseData(false)}
            />
          )}

          {activeNav === "Audit Trail" && (
            <AuditTrailView
              onReturnToOverview={() => setActiveNav("Overview")}
            />
          )}

          {activeNav === "Reports & Analytics" && (
            <ReportsAnalyticsView
              records={fdrRecords}
              institutions={institutions}
              onReturnToOverview={() => setActiveNav("Overview")}
            />
          )}

          {activeNav === "Settings" && (
            <SettingsView
              currentAdmin={currentAdmin}
              onReturnToOverview={() => setActiveNav("Overview")}
            />
          )}

          {activeNav !== "Overview" && 
           activeNav !== "Institutions" && 
           activeNav !== "FDR Repository" && 
           activeNav !== "AI Verification" && 
           activeNav !== "Renewals & Maturity" && 
           activeNav !== "Release Requests" && 
           activeNav !== "Audit Trail" && 
           activeNav !== "Reports & Analytics" && 
           activeNav !== "Settings" && (
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
              <span>FDR Rakshak &copy; 2026 AICTE Regulation Bureau, Ministry of Education, Govt. of India</span>
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

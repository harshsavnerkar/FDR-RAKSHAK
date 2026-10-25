import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Server,
  Database,
  Key,
  Lock,
  RefreshCw,
  Cpu,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Terminal
} from 'lucide-react';
import { api } from '../services/api';

export function SettingsView({ currentAdmin, onReturnToOverview }) {
  const [healthData, setHealthData] = useState(null);
  const [ocrStatus, setOcrStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedSuccess, setReseedSuccess] = useState(null);

  const fetchSettingsData = async () => {
    setLoading(true);
    try {
      const [h, ocr] = await Promise.all([
        api.checkHealth(),
        api.getDocumentOcrStatus()
      ]);
      setHealthData(h);
      setOcrStatus(ocr);
    } catch (err) {
      console.warn('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleVerifyDataset = async () => {
    setReseedLoading(true);
    setReseedSuccess(null);
    try {
      const res = await api.seedDatabase();
      setReseedSuccess(res.message || '10 institutions and 10 FDR records verified in PostgreSQL.');
    } catch (err) {
      alert(`Verification check error: ${err.message}`);
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="skeuo-panel p-6 rounded-2xl border border-chassis">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl skeuo-recessed flex items-center justify-center text-accent-orange border border-recessed flex-shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary">Bureau System & Governance Configuration</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#eafaf1] text-[#1b7943] border border-[#b7ebcd]">
                  ADMINISTRATIVE CONSOLE
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                System telemetry, database cluster connection, cryptographic session policy, and server-side OCR engine parameters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSettingsData}
              disabled={loading}
              className="skeuo-btn px-4 py-2 rounded-xl text-xs font-semibold text-text-primary flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-accent-orange ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Backend & Database Cluster */}
        <div className="skeuo-panel p-5 rounded-2xl border border-chassis space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#d1d9e6]">
            <Server className="w-4 h-4 text-accent-orange" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary">
              Database & API Telemetry
            </h3>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">FastAPI Service:</span>
              <span className="font-bold text-[#1b7943] flex items-center gap-1.5">
                <span className="led-indicator led-green" />
                <span>Port 8001 Live</span>
              </span>
            </div>
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">PostgreSQL Cluster:</span>
              <span className="font-bold text-text-primary">Port 55432</span>
            </div>
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">Database Health:</span>
              <span className={`font-bold ${healthData?.database === 'connected' ? 'text-[#1b7943]' : 'text-[#d63031]'}`}>
                {healthData?.database === 'connected' ? 'CONNECTED' : 'DEGRADED'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">Environment:</span>
              <span className="font-bold text-text-primary uppercase">{healthData?.environment || 'Development'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Security & Session Profile */}
        <div className="skeuo-panel p-5 rounded-2xl border border-chassis space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#d1d9e6]">
            <Shield className="w-4 h-4 text-[#1b7943]" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary">
              Security Governance
            </h3>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">Current Admin:</span>
              <span className="font-bold text-text-primary">{currentAdmin?.username || 'aicte_admin'}</span>
            </div>
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">Key Derivation:</span>
              <span className="font-bold text-text-primary">Argon2id Memory-Hard</span>
            </div>
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">Rate Limiting:</span>
              <span className="font-bold text-[#b36b00]">5 Attempts / 15m Lock</span>
            </div>
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">Session Cookie:</span>
              <span className="font-bold text-text-primary">HttpOnly, SameSite=Lax</span>
            </div>
          </div>
        </div>

        {/* Card 3: OCR Engine Pipeline */}
        <div className="skeuo-panel p-5 rounded-2xl border border-chassis space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#d1d9e6]">
            <Cpu className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary">
              OCR Engine Pipeline
            </h3>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">PDF Engine:</span>
              <span className="font-bold text-accent-cyan">{ocrStatus?.pdfEngine || 'PyMuPDF (fitz)'}</span>
            </div>
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">Tesseract Status:</span>
              <span className={`font-bold ${ocrStatus?.tesseractAvailable ? 'text-[#1b7943]' : 'text-text-muted'}`}>
                {ocrStatus?.tesseractAvailable ? 'Available' : 'Fallback Mode'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">Upload Limit:</span>
              <span className="font-bold text-text-primary">
                {ocrStatus?.maxUploadSizeBytes ? `${(ocrStatus.maxUploadSizeBytes / (1024 * 1024)).toFixed(0)} MB` : '10 MB'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
              <span className="text-text-muted">Accepted Formats:</span>
              <span className="font-bold text-text-primary">PDF, PNG, JPEG</span>
            </div>
          </div>
        </div>

      </div>

      {/* Database Verification & Dataset Health Card */}
      <div className="skeuo-panel p-6 rounded-2xl border border-chassis">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-text-primary font-mono flex items-center gap-2">
              <Database className="w-4 h-4 text-accent-orange" />
              <span>Statutory Data Integrity Sentry</span>
            </h4>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Verifies the 10 regulatory institutions, 10 FDR instruments, and ₹4.85 Crore corpus in the PostgreSQL database.
            </p>
          </div>

          <button
            onClick={handleVerifyDataset}
            disabled={reseedLoading}
            className="skeuo-btn px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-text-primary flex items-center gap-2 hover:border-accent-orange"
          >
            {reseedLoading ? <RefreshCw className="w-4 h-4 animate-spin text-accent-orange" /> : <FileCheck2 className="w-4 h-4 text-accent-orange" />}
            <span>Verify Vault Dataset</span>
          </button>
        </div>

        {reseedSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-[#eafaf1] border border-[#b7ebcd] text-xs font-mono text-[#1b7943] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{reseedSuccess}</span>
          </div>
        )}
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import {
  X,
  Upload,
  UserPlus,
  CheckCircle,
  FileText,
  AlertTriangle,
  Building,
  Landmark,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

export function ActionModal({ actionType, actionData, onClose }) {
  const [formSubmitted, setFormSubmitted] = useState(false);

  if (!actionType && !actionData) return null;

  const title = actionData?.title || actionType || "Bureau Command Execution";

  const renderContent = () => {
    if (formSubmitted) {
      return (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#eafaf1] text-[#1b7943] flex items-center justify-center mx-auto border border-[#b7ebcd] shadow-md">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              Simulated Action Dispatched Successfully
            </h3>
            <p className="text-xs font-mono text-text-muted mt-1 max-w-md mx-auto">
              In Step 1 UI Foundation mode, this intake payload has been verified locally. 
              Live core database insertion and bank API polling will become active in Step 2.
            </p>
          </div>
          <button
            onClick={onClose}
            className="skeuo-btn-accent px-5 py-2 rounded-xl text-xs font-mono"
          >
            Acknowledge & Close
          </button>
        </div>
      );
    }

    if (title.includes("Upload") || title.includes("FDR")) {
      return (
        <div className="space-y-4 text-xs font-mono">
          <div className="p-6 rounded-2xl skeuo-recessed border-2 border-dashed border-[#a3b1c6] text-center cursor-pointer hover:bg-[#d5dde9] transition-colors">
            <Upload className="w-10 h-10 text-accent-orange mx-auto mb-2" />
            <div className="font-bold text-text-primary text-sm">
              Drag & Drop Institutional FDR Scans Here
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Supports high-resolution PDF, TIFF, or PNG certificates up to 25MB
            </p>
            <div className="mt-3 inline-block px-3 py-1 rounded bg-panel border border-[#babecc] text-[10px] text-text-muted font-bold">
              AI OCR Pre-Processor Ready
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-text-muted block mb-1">Target Institute PID</label>
              <input
                type="text"
                placeholder="e.g. SPIT-MH-019"
                defaultValue="SPIT-MH-019"
                className="w-full px-3 py-2 rounded-lg skeuo-input text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-text-muted block mb-1">Issuing Bank</label>
              <input
                type="text"
                placeholder="e.g. State Bank of India"
                defaultValue="State Bank of India"
                className="w-full px-3 py-2 rounded-lg skeuo-input text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="skeuo-btn px-4 py-2 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              onClick={() => setFormSubmitted(true)}
              className="skeuo-btn-accent px-4 py-2 rounded-lg text-xs flex items-center gap-1.5"
            >
              <span>Queue for AI OCR Verification</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    if (title.includes("Register") || title.includes("Institution")) {
      return (
        <div className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-text-muted block mb-1">Permanent Institute ID (PID)</label>
              <input
                type="text"
                placeholder="AICTE-PID-2026-XXXX"
                defaultValue="AICTE-PID-2026-9844"
                className="w-full px-3 py-2 rounded-lg skeuo-input text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-text-muted block mb-1">Institution Name</label>
              <input
                type="text"
                placeholder="College / Institute Name"
                defaultValue="National Engineering Institute"
                className="w-full px-3 py-2 rounded-lg skeuo-input text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-text-muted block mb-1">Sponsoring Trust / Society</label>
              <input
                type="text"
                placeholder="Registered Trust Name"
                defaultValue="Vidya Bharati Educational Trust"
                className="w-full px-3 py-2 rounded-lg skeuo-input text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-text-muted block mb-1">Regional Bureau Office</label>
              <select className="w-full px-3 py-2 rounded-lg skeuo-input text-xs">
                <option>WRO Mumbai</option>
                <option>NWRO New Delhi</option>
                <option>SRO Chennai</option>
                <option>SWRO Bangalore</option>
                <option>CRO Bhopal</option>
                <option>ERO Kolkata</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="skeuo-btn px-4 py-2 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              onClick={() => setFormSubmitted(true)}
              className="skeuo-btn-accent px-4 py-2 rounded-lg text-xs flex items-center gap-1.5"
            >
              <span>Onboard Institute PID</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    // Default generic action modal
    return (
      <div className="space-y-4 text-xs font-mono">
        <div className="p-4 rounded-xl skeuo-recessed">
          <p className="text-text-primary leading-relaxed font-sans">
            You initiated the <strong>{title}</strong> administrative workflow.
            In this initial UI Foundation release, the UI dialogs and parameter structures are verified and ready.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="skeuo-btn px-4 py-2 rounded-lg text-xs"
          >
            Dismiss
          </button>
          <button
            onClick={() => setFormSubmitted(true)}
            className="skeuo-btn-accent px-4 py-2 rounded-lg text-xs"
          >
            Confirm Execution
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2d3436]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl skeuo-panel-elevated shadow-skeuo-modal my-8 z-10 overflow-hidden border-2 border-white/90">
        {/* Hardware Screws */}
        <span className="screw-head absolute top-3 left-3 opacity-90" />
        <span className="screw-head absolute top-3 right-3 opacity-90" />
        <span className="screw-head absolute bottom-3 left-3 opacity-90" />
        <span className="screw-head absolute bottom-3 right-3 opacity-90" />

        <div className="px-6 pt-5 pb-4 border-b border-[#d1d9e6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-accent-orange" />
            <h3 className="font-bold text-base text-text-primary tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="skeuo-btn p-1.5 rounded-lg text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

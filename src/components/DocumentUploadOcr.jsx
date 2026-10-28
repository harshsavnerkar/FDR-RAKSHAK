import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Link2,
  ShieldCheck,
  Eye,
  Cpu,
  FileCheck,
  ArrowRight,
  Info,
  Building,
  Landmark,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldAlert,
  Save,
  Check,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../data/sampleFdrData';
import { ComplianceAuditView } from './ComplianceAuditView';

export function DocumentUploadOcr({
  institutions = [],
  fdrRecords = [],
  onFdrCreated,
  onFdrUpdated,
  onNavigateToRepository
}) {
  // OCR engine state
  const [engineStatus, setEngineStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Upload & Extraction state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Review & Confirmation Form state
  const [formData, setFormData] = useState({
    reference: '',
    institutionCode: '',
    bankName: '',
    branch: '',
    ifsc: '',
    certificateNo: '',
    depositAmount: '',
    interestRate: '7.10%',
    issueDate: '',
    maturityDate: '',
    maturityAmount: '',
    category: 'Institutional Guarantee',
    priority: 'Standard',
    verificationStatus: 'Pending',
    discrepancyNote: ''
  });

  // Track manually modified fields vs original OCR extracted fields
  const [modifiedFields, setModifiedFields] = useState(new Set());
  const [showRawText, setShowRawText] = useState(false);
  const [showComplianceAudit, setShowComplianceAudit] = useState(false);

  // Action Mode: 'new' (Vault as New FDR) vs 'link' (Link to Existing Vaulted FDR)
  const [actionMode, setActionMode] = useState('new');
  const [selectedExistingFdrId, setSelectedExistingFdrId] = useState('');
  const [updateExistingValues, setUpdateExistingValues] = useState(false);
  const [verificationNote, setVerificationNote] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Document Preview Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch OCR Engine capabilities on mount
  useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await api.getDocumentOcrStatus();
        setEngineStatus(data);
      } catch (err) {
        console.warn('Could not load OCR engine status:', err);
      } finally {
        setStatusLoading(false);
      }
    }
    fetchStatus();
  }, []);

  // Populate form whenever new OCR extraction result arrives
  useEffect(() => {
    if (ocrResult?.extractedFields) {
      const ext = ocrResult.extractedFields;
      
      // Auto-match institution by detected name
      let matchedInstCode = '';
      if (ext.accountHolder) {
        const detectedLower = ext.accountHolder.toLowerCase();
        const found = institutions.find(i => 
          detectedLower.includes(i.name.toLowerCase()) || 
          i.name.toLowerCase().includes(detectedLower) ||
          detectedLower.includes(i.code.toLowerCase())
        );
        if (found) matchedInstCode = found.code;
      }
      if (!matchedInstCode && institutions.length > 0) {
        matchedInstCode = institutions[0].code;
      }

      setFormData({
        reference: ext.reference || '',
        institutionCode: matchedInstCode,
        bankName: ext.bankName || '',
        branch: ext.branch || 'Main Commercial Branch',
        ifsc: ext.ifsc || '',
        certificateNo: ext.certificateNo || '',
        depositAmount: ext.depositAmount ? String(ext.depositAmount) : '',
        interestRate: ext.interestRate || '7.10%',
        issueDate: ext.issueDate || '',
        maturityDate: ext.maturityDate || '',
        maturityAmount: ext.maturityAmount ? String(ext.maturityAmount) : '',
        category: 'Statutory Lien',
        priority: 'Standard',
        verificationStatus: ocrResult.ambiguities?.length > 0 ? 'Discrepancy' : 'Pending',
        discrepancyNote: ocrResult.ambiguities?.length > 0 ? ocrResult.ambiguities.join('; ') : ''
      });
      setModifiedFields(new Set());
      setSubmitSuccess(null);
      setSubmitError(null);

      // Default select first existing FDR if available
      if (fdrRecords.length > 0) {
        setSelectedExistingFdrId(fdrRecords[0].id);
      }
    }
  }, [ocrResult, institutions, fdrRecords]);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setUploadError('Invalid file type. Supported formats: PDF, PNG, JPEG.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10 MB limit. Please upload a smaller scan.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setOcrResult(null);
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  // Upload and perform OCR
  const handleUploadAndScan = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setSubmitSuccess(null);

    try {
      const response = await api.uploadDocument(selectedFile);
      setOcrResult(response);
      setPreviewBlobUrl(null); // Reset preview url for new document
    } catch (err) {
      console.error('Document scan error:', err);
      setUploadError(err.message || 'Failed to process document scan.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenPreview = async () => {
    if (!ocrResult?.documentId) return;
    setShowPreviewModal(true);
    if (!previewBlobUrl) {
      setPreviewLoading(true);
      try {
        const previewUrl = api.getDocumentPreviewUrl(ocrResult.documentId);
        const res = await fetch(previewUrl, { credentials: 'include' });
        if (!res.ok) throw new Error(`Preview retrieval failed (HTTP ${res.status})`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(objectUrl);
      } catch (err) {
        console.warn('Document preview error:', err);
      } finally {
        setPreviewLoading(false);
      }
    }
  };

  // Field change tracker to flag manual adjustments
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setModifiedFields(prev => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  };

  // Save / Link Handler
  const handleFinalizeRecord = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (actionMode === 'new') {
        // Vault as New FDR
        if (!formData.reference.trim()) {
          throw new Error('FDR Reference Number is required.');
        }
        if (!formData.institutionCode) {
          throw new Error('Please select an associated institution.');
        }
        if (!formData.depositAmount || Number(formData.depositAmount) <= 0) {
          throw new Error('A valid deposit amount greater than zero is required.');
        }
        if (!formData.bankName.trim()) {
          throw new Error('Issuing Bank Name is required.');
        }
        if (!formData.issueDate || !formData.maturityDate) {
          throw new Error('Both Issue Date and Maturity Date are required.');
        }

        const newFdrPayload = {
          reference: formData.reference.trim().toUpperCase(),
          institutionCode: formData.institutionCode,
          bankName: formData.bankName.trim(),
          branch: formData.branch.trim() || 'Central Branch',
          ifsc: (formData.ifsc || 'SBIN0001823').trim().toUpperCase(),
          certificateNo: formData.certificateNo.trim() || null,
          depositAmount: Number(formData.depositAmount),
          currency: 'INR',
          interestRate: formData.interestRate || '7.10%',
          issueDate: formData.issueDate,
          maturityDate: formData.maturityDate,
          verificationStatus: formData.verificationStatus || 'Pending',
          priority: formData.priority || 'Standard',
          jointLienHolder: 'AICTE New Delhi',
          lienStatus: 'Lien Marked to AICTE New Delhi',
          ocrConfidence: ocrResult?.overallConfidence || 92.0,
          physicalLocation: `Vault Intake / Scan Ref: ${ocrResult?.originalFilename || 'Manual Verification'}`,
          discrepancyNote: formData.discrepancyNote || null,
          category: formData.category || 'Statutory Deposit'
        };

        const created = await api.createFdr(newFdrPayload);
        
        // Also link the uploaded document session if available
        if (ocrResult?.documentId && created.id) {
          try {
            await api.linkDocumentToFdr(ocrResult.documentId, {
              fdrId: created.id,
              notes: 'Vaulted new FDR from OCR document scan intake.'
            });
          } catch (linkErr) {
            console.warn('Document linking non-fatal error:', linkErr);
          }
        }

        if (onFdrCreated) onFdrCreated(created);
        setSubmitSuccess({
          mode: 'new',
          message: `FDR instrument "${created.reference}" successfully registered and vaulted in PostgreSQL!`,
          record: created
        });
      } else {
        // Link to Existing Vaulted FDR
        if (!selectedExistingFdrId) {
          throw new Error('Please select an existing vaulted FDR record to link.');
        }

        const linkPayload = {
          fdrId: selectedExistingFdrId,
          updateVaultRecord: updateExistingValues,
          notes: verificationNote || 'Administrative OCR scan audit verification.',
          correctedFields: updateExistingValues ? {
            bankName: formData.bankName,
            branch: formData.branch,
            ifsc: formData.ifsc,
            depositAmount: Number(formData.depositAmount),
            issueDate: formData.issueDate,
            maturityDate: formData.maturityDate,
            interestRate: formData.interestRate,
            verificationStatus: 'Verified'
          } : null
        };

        const linkResponse = await api.linkDocumentToFdr(ocrResult.documentId, linkPayload);
        
        // Fetch updated FDR to sync parent state
        const updatedFdr = await api.getFdr(selectedExistingFdrId);
        if (onFdrUpdated) onFdrUpdated(updatedFdr);

        setSubmitSuccess({
          mode: 'link',
          message: linkResponse.message || `Document scan successfully attached to FDR ${linkResponse.fdrReference}.`,
          notes: linkResponse.notes
        });
      }
    } catch (err) {
      console.error('Finalize record error:', err);
      setSubmitError(err.message || 'Operation failed. Please verify input fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute live diff if linking to existing record
  const existingFdrRecord = fdrRecords.find(r => r.id === selectedExistingFdrId);
  const hasAmountDiscrepancy = existingFdrRecord && formData.depositAmount && 
    Math.abs(Number(existingFdrRecord.depositAmount) - Number(formData.depositAmount)) > 0.01;
  const hasRefDiscrepancy = existingFdrRecord && formData.reference && 
    existingFdrRecord.reference.toUpperCase() !== formData.reference.toUpperCase();
  const hasMaturityDiscrepancy = existingFdrRecord && formData.maturityDate &&
    existingFdrRecord.maturityDate !== formData.maturityDate;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner & Module Telemetry */}
      <div className="p-5 rounded-xl skeuo-panel border-l-4 border-l-accent-cyan relative overflow-hidden">
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#d1d9e6] text-text-muted border border-[#babecc]">
                OPTICAL VERIFICATION BUREAU
              </span>
              <span className="text-xs font-mono text-text-muted">
                Document Ingestion & Automated Text Extraction (Step 4)
              </span>
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-accent-cyan" />
              <span>AI Verification & FDR Document OCR</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5 max-w-2xl">
              Upload institutional FDR scans (PDF, PNG, JPEG), run deterministic OCR extraction, review extracted values against banking rules, and vault as new instruments or link to existing records.
            </p>
          </div>

          {/* OCR Engine Readout Indicator */}
          <div className="p-3 rounded-lg skeuo-recessed text-xs font-mono border border-[#d1d9e6] flex flex-col gap-1 min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-[11px]">PDF Parser:</span>
              <span className="font-bold text-[#1b7943] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#1b7943]" />
                <span>PyMuPDF Native</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-[11px]">Image OCR:</span>
              {engineStatus?.tesseractAvailable ? (
                <span className="font-bold text-[#1b7943] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#1b7943]" />
                  <span>Tesseract Active</span>
                </span>
              ) : (
                <span className="font-bold text-[#b7791f] flex items-center gap-1" title="PDF text extraction active; image OCR fallback available">
                  <Info className="w-3 h-3 text-[#b7791f]" />
                  <span>PDF Engine Active</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone & Scanner */}
      <div className="skeuo-panel p-6 relative overflow-hidden">
        <span className="screw-head absolute top-3 left-3 opacity-80" />
        <span className="screw-head absolute top-3 right-3 opacity-80" />
        <span className="screw-head absolute bottom-3 left-3 opacity-80" />
        <span className="screw-head absolute bottom-3 right-3 opacity-80" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-accent-orange" />
            <h3 className="text-sm font-bold text-text-primary tracking-wide uppercase font-mono">
              FDR Document Intake Port
            </h3>
          </div>
          <span className="text-[11px] font-mono text-text-muted">
            Max File Size: 10 MB | Supported: PDF, PNG, JPEG
          </span>
        </div>

        {/* Drag and Drop Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 select-none ${
            isDragOver
              ? 'border-accent-cyan bg-accent-cyan/5 scale-[0.99]'
              : 'border-[#babecc] hover:border-accent-orange/60 bg-[#edf2f7]/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full skeuo-panel flex items-center justify-center text-accent-orange shadow-md">
              <FileText className="w-6 h-6" />
            </div>

            {selectedFile ? (
              <div className="mt-2">
                <p className="text-sm font-bold text-text-primary font-mono flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1b7943]" />
                  <span>{selectedFile.name}</span>
                </p>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Document'}
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm font-bold text-text-primary font-mono">
                  Drag and drop FDR receipt scan here, or <span className="text-accent-orange underline">browse file</span>
                </p>
                <p className="text-xs text-text-muted mt-1 font-mono">
                  Upload bank-stamped Fixed Deposit Receipt or tripartite lien certificate
                </p>
              </div>
            )}
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 rounded-lg bg-[#fff1f0] border border-[#ffa39e] text-[#cf1322] text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[11px] text-text-muted font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1b7943]" />
            <span>Files validated on intake; isolated in secure server vault storage.</span>
          </div>

          <button
            onClick={handleUploadAndScan}
            disabled={!selectedFile || isUploading}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              !selectedFile || isUploading
                ? 'opacity-50 cursor-not-allowed skeuo-panel text-text-muted'
                : 'skeuo-btn-accent text-white shadow-lg active:scale-95'
            }`}
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Running OCR Extraction...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Execute OCR Extraction</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Review & Confirmation Workspace (Shown when OCR completes) */}
      {ocrResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Extraction Telemetry & Raw Text (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Dossier Card */}
            <div className="skeuo-panel p-5 relative overflow-hidden">
              <span className="screw-head absolute top-3 left-3 opacity-80" />
              <span className="screw-head absolute top-3 right-3 opacity-80" />

              <h4 className="text-xs font-bold text-text-primary uppercase font-mono tracking-wider mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-accent-cyan" />
                <span>Document Ingestion Dossier</span>
              </h4>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
                  <span className="text-text-muted">Original File:</span>
                  <span className="font-bold text-text-primary truncate max-w-[170px]" title={ocrResult.originalFilename}>
                    {ocrResult.originalFilename}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
                  <span className="text-text-muted">Parser Engine:</span>
                  <span className="font-bold text-accent-cyan truncate max-w-[170px]" title={ocrResult.engineUsed}>
                    {ocrResult.engineUsed}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
                  <span className="text-text-muted">OCR Confidence:</span>
                  <span className={`font-bold ${
                    ocrResult.overallConfidence >= 80 ? 'text-[#1b7943]' : 'text-[#b7791f]'
                  }`}>
                    {ocrResult.overallConfidence}% • {ocrResult.overallConfidence >= 80 ? 'High Confidence' : 'Moderate'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg skeuo-recessed flex items-center justify-between">
                  <span className="text-text-muted">Field Completeness:</span>
                  <span className={`font-bold ${ocrResult.isComplete ? 'text-[#1b7943]' : 'text-[#b7791f]'}`}>
                    {ocrResult.isComplete ? 'All Mandatory Extracted' : 'Missing Fields Detected'}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenPreview}
                    className="w-full py-2 px-3 rounded-lg skeuo-btn text-xs font-mono font-bold flex items-center justify-center gap-2 text-accent-cyan hover:text-accent-cyan/80 transition-colors shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-accent-cyan" />
                    <span>Preview Document Scan</span>
                  </button>
                </div>
              </div>

              {/* Ambiguities / Warnings */}
              {ocrResult.ambiguities && ocrResult.ambiguities.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-[#fff8e6] border border-[#ffd166] text-[#b36b00] text-xs font-mono">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#b36b00]" />
                    <span>Ambiguity Alerts ({ocrResult.ambiguities.length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {ocrResult.ambiguities.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw Extracted Text Drawer */}
              <div className="mt-4 pt-4 border-t border-[#d1d9e6]">
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="w-full py-1.5 px-3 rounded-lg skeuo-panel text-xs font-mono font-bold flex items-center justify-between text-text-primary"
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-accent-orange" />
                    <span>Raw Extracted OCR Text</span>
                  </span>
                  {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showRawText && (
                  <div className="mt-2 p-3 rounded-lg skeuo-recessed text-[11px] font-mono text-text-secondary max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text border border-[#babecc]/50">
                    {ocrResult.rawText || '(No readable text extracted)'}
                  </div>
                )}
              </div>
            </div>

            {/* Statutory Disclaimer Box */}
            <div className="p-4 rounded-xl skeuo-panel border-l-4 border-l-[#d9534f] text-[11px] font-mono text-text-secondary space-y-1.5 shadow-sm">
              <div className="flex items-center gap-1.5 font-bold text-text-primary text-xs">
                <ShieldAlert className="w-4 h-4 text-[#d9534f]" />
                <span>Statutory Verification Warning</span>
              </div>
              <p className="leading-relaxed">
                Automated optical character recognition (OCR) and text parsing do not constitute legal verification of bank lien authenticity.
                All values must be reviewed by the AICTE Bureau Administrator against physical bank records or SFMS verification.
              </p>
            </div>
          </div>

          {/* Right Column: Editable Review & Save / Link Form (8 cols) */}
          <div className="lg:col-span-8">
            <div className="skeuo-panel p-6 relative overflow-hidden">
              <span className="screw-head absolute top-3 left-3 opacity-80" />
              <span className="screw-head absolute top-3 right-3 opacity-80" />
              <span className="screw-head absolute bottom-3 left-3 opacity-80" />
              <span className="screw-head absolute bottom-3 right-3 opacity-80" />

              {/* Header & Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#d1d9e6]">
                <div>
                  <h3 className="text-base font-bold text-text-primary font-mono tracking-tight flex items-center gap-2">
                    <span>OCR Field Review & Confirmation</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5 font-mono">
                    Green badges indicate extracted fields. Manually corrected fields are highlighted.
                  </p>
                </div>

                {/* Mode Selector Toggle */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl skeuo-recessed border border-[#d1d9e6]">
                  <button
                    type="button"
                    onClick={() => setActionMode('new')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      actionMode === 'new'
                        ? 'bg-chassis text-accent-orange shadow-md border border-[#d1d9e6]'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Vault as New FDR
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionMode('link')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      actionMode === 'link'
                        ? 'bg-chassis text-accent-cyan shadow-md border border-[#d1d9e6]'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Link to Existing FDR
                  </button>
                </div>
              </div>

              {/* Feedback messages */}
              {submitSuccess && (
                <div className="mb-5 p-4 rounded-xl bg-[#eafaf1] border border-[#b7ebcd] text-[#1b7943] text-xs font-mono space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#1b7943]" />
                    <span>{submitSuccess.message}</span>
                  </div>
                  {submitSuccess.notes && submitSuccess.notes.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] text-[#276749]">
                      {submitSuccess.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  )}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onNavigateToRepository}
                      className="px-3 py-1.5 rounded-lg bg-[#1b7943] text-white font-bold hover:bg-[#166534] flex items-center gap-1.5"
                    >
                      <span>Open FDR Central Repository</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#fff1f0] border border-[#ffa39e] text-[#cf1322] text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleFinalizeRecord} className="space-y-4">
                
                {/* Linking Mode: Existing Record Selector & Live Diff */}
                {actionMode === 'link' && (
                  <div className="p-4 rounded-xl bg-[#edf2f7] border border-[#cbd5e1] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-primary font-mono flex items-center gap-1.5">
                        <Link2 className="w-4 h-4 text-accent-cyan" />
                        <span>Select Existing Vaulted FDR to Attach Document:</span>
                      </label>
                      <span className="text-[11px] font-mono text-text-muted">
                        {fdrRecords.length} Instruments in Vault
                      </span>
                    </div>

                    <select
                      value={selectedExistingFdrId}
                      onChange={(e) => setSelectedExistingFdrId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary"
                    >
                      {fdrRecords.map(rec => (
                        <option key={rec.id} value={rec.id}>
                          {rec.reference} — {rec.institution} ({formatINR(rec.depositAmount)}) [Maturity: {formatDate(rec.maturityDate)}]
                        </option>
                      ))}
                    </select>

                    {/* Discrepancy & Audit Diff Readout */}
                    {existingFdrRecord && (
                      <div className="mt-2 p-3 rounded-lg skeuo-recessed text-xs font-mono space-y-2 border border-[#d1d9e6]">
                        <div className="flex items-center justify-between text-[11px] border-b border-[#d1d9e6] pb-1">
                          <span className="font-bold text-text-primary">Vault vs OCR Scan Comparison:</span>
                          <span className="text-text-muted">ID: {existingFdrRecord.id}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-text-muted">Vault Amount:</span>{' '}
                            <span className="font-bold text-text-primary">{formatINR(existingFdrRecord.depositAmount)}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Scanned Amount:</span>{' '}
                            <span className={`font-bold ${hasAmountDiscrepancy ? 'text-[#cf1322]' : 'text-[#1b7943]'}`}>
                              {formData.depositAmount ? formatINR(Number(formData.depositAmount)) : '(Not detected)'}
                            </span>
                          </div>

                          <div>
                            <span className="text-text-muted">Vault Maturity:</span>{' '}
                            <span className="font-bold text-text-primary">{existingFdrRecord.maturityDate || '(None)'}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Scanned Maturity:</span>{' '}
                            <span className={`font-bold ${hasMaturityDiscrepancy ? 'text-[#cf1322]' : 'text-[#1b7943]'}`}>
                              {formData.maturityDate || '(Not detected)'}
                            </span>
                          </div>
                        </div>

                        {hasAmountDiscrepancy && (
                          <div className="text-[11px] text-[#cf1322] flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Deposit amount variance detected! Document scan differs from institutional vault record.</span>
                          </div>
                        )}

                        {hasMaturityDiscrepancy && (
                          <div className="text-[11px] text-[#cf1322] flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Maturity date variance detected! Vault indicates {existingFdrRecord.maturityDate} while scan indicates {formData.maturityDate}.</span>
                          </div>
                        )}

                        <div className="pt-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="updateExistingCheckbox"
                            checked={updateExistingValues}
                            onChange={(e) => setUpdateExistingValues(e.target.checked)}
                            className="rounded border-[#babecc] text-accent-orange focus:ring-accent-orange"
                          />
                          <label htmlFor="updateExistingCheckbox" className="text-[11px] font-bold text-text-primary select-none cursor-pointer">
                            Update vaulted terms with OCR reviewed values (overwrites existing fields)
                          </label>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-mono text-text-muted mb-1">
                        Administrative Audit Verification Note:
                      </label>
                      <input
                        type="text"
                        value={verificationNote}
                        onChange={(e) => setVerificationNote(e.target.value)}
                        placeholder="e.g., Verified against physical bank lien letter received via courier."
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[#d1d9e6]/70">
                      <button
                        type="button"
                        onClick={() => setShowComplianceAudit(!showComplianceAudit)}
                        className="skeuo-btn px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 text-accent-cyan hover:text-accent-cyan"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>{showComplianceAudit ? 'Hide Compliance Engine Pre-Check' : 'Run Compliance Engine Pre-Check'}</span>
                      </button>
                      <span className="text-[10px] font-mono text-text-muted">
                        Real-time 8-rule discrepancy cross-audit
                      </span>
                    </div>

                    {showComplianceAudit && selectedExistingFdrId && (
                      <div className="mt-2 p-3.5 rounded-xl skeuo-panel border border-[#d1d9e6]">
                        <ComplianceAuditView
                          fdrId={selectedExistingFdrId}
                          customDocData={formData}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Form Field Rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* FDR Reference */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-text-primary font-mono">
                        FDR Reference Number *
                      </label>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        modifiedFields.has('reference')
                          ? 'bg-[#fff8e6] text-[#b36b00] border-[#ffd166]'
                          : formData.reference
                          ? 'bg-[#eafaf1] text-[#1b7943] border-[#b7ebcd]'
                          : 'bg-[#edf2f7] text-text-muted border-[#cbd5e1]'
                      }`}>
                        {modifiedFields.has('reference') ? 'Modified' : formData.reference ? 'Extracted' : 'Missing'}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.reference}
                      onChange={(e) => handleFieldChange('reference', e.target.value)}
                      placeholder="e.g. FDR-AICTE-2026-SPIT-001"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary focus:border-accent-cyan uppercase"
                    />
                  </div>

                  {/* Institution Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-text-primary font-mono">
                        Associated AICTE Institution *
                      </label>
                      <span className="text-[10px] font-mono text-text-muted">
                        {institutions.length} in Registry
                      </span>
                    </div>
                    <select
                      required
                      value={formData.institutionCode}
                      onChange={(e) => handleFieldChange('institutionCode', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary"
                    >
                      <option value="">Select Associated Institution...</option>
                      {institutions.map(i => (
                        <option key={i.code} value={i.code}>
                          {i.code} — {i.name} ({i.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Issuing Bank Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-text-primary font-mono">
                        Issuing Bank Name *
                      </label>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        modifiedFields.has('bankName')
                          ? 'bg-[#fff8e6] text-[#b36b00] border-[#ffd166]'
                          : formData.bankName
                          ? 'bg-[#eafaf1] text-[#1b7943] border-[#b7ebcd]'
                          : 'bg-[#edf2f7] text-text-muted border-[#cbd5e1]'
                      }`}>
                        {modifiedFields.has('bankName') ? 'Modified' : formData.bankName ? 'Extracted' : 'Missing'}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.bankName}
                      onChange={(e) => handleFieldChange('bankName', e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary"
                    />
                  </div>

                  {/* Principal Deposit Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-text-primary font-mono">
                        Deposit Amount (INR) *
                      </label>
                      {formData.depositAmount && !isNaN(Number(formData.depositAmount)) && (
                        <span className="text-[11px] font-bold text-accent-orange font-mono">
                          {formatINR(Number(formData.depositAmount))}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={formData.depositAmount}
                      onChange={(e) => handleFieldChange('depositAmount', e.target.value)}
                      placeholder="e.g. 3500000"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary font-bold text-accent-orange"
                    />
                  </div>

                  {/* Branch & IFSC */}
                  <div>
                    <label className="block text-xs font-bold text-text-primary font-mono mb-1">
                      Bank Branch Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.branch}
                      onChange={(e) => handleFieldChange('branch', e.target.value)}
                      placeholder="e.g. Nariman Point, Mumbai"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-text-primary font-mono">
                        IFSC Code (11 Chars) *
                      </label>
                      <span className="text-[10px] font-mono text-text-muted">
                        Format: [A-Z]{'{4}'}0[A-Z0-9]{'{6}'}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={formData.ifsc}
                      onChange={(e) => handleFieldChange('ifsc', e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001823"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary uppercase"
                    />
                  </div>

                  {/* Issue Date & Maturity Date */}
                  <div>
                    <label className="block text-xs font-bold text-text-primary font-mono mb-1">
                      Issue Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.issueDate}
                      onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary font-mono mb-1">
                      Maturity Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.maturityDate}
                      onChange={(e) => handleFieldChange('maturityDate', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary"
                    />
                  </div>

                  {/* Interest Rate & Certificate Number */}
                  <div>
                    <label className="block text-xs font-bold text-text-primary font-mono mb-1">
                      Interest Rate (% p.a.)
                    </label>
                    <input
                      type="text"
                      value={formData.interestRate}
                      onChange={(e) => handleFieldChange('interestRate', e.target.value)}
                      placeholder="e.g. 7.10%"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary font-mono mb-1">
                      Certificate / STDR Number
                    </label>
                    <input
                      type="text"
                      value={formData.certificateNo}
                      onChange={(e) => handleFieldChange('certificateNo', e.target.value)}
                      placeholder="e.g. CERT-SBI-2024-9981"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg skeuo-input border border-[#babecc] text-text-primary"
                    />
                  </div>
                </div>

                {/* Submit Action Controls */}
                <div className="pt-4 border-t border-[#d1d9e6] flex items-center justify-between">
                  <div className="text-[11px] font-mono text-text-muted">
                    {modifiedFields.size > 0 ? (
                      <span className="text-[#b36b00]">
                        {modifiedFields.size} field(s) manually corrected.
                      </span>
                    ) : (
                      <span>Unmodified OCR values.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOcrResult(null)}
                      className="px-4 py-2 text-xs font-mono font-bold rounded-xl skeuo-panel text-text-secondary hover:text-text-primary"
                    >
                      Clear & Re-scan
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 text-xs font-mono font-bold rounded-xl skeuo-btn-accent text-white shadow-md active:scale-95 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Processing...</span>
                        </>
                      ) : actionMode === 'new' ? (
                        <>
                          <Save className="w-4 h-4 text-white" />
                          <span>Confirm & Vault New FDR</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 text-white" />
                          <span>Link to Vault Record</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* Document Scan In-Browser Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="skeuo-panel-elevated w-full max-w-4xl p-6 rounded-2xl relative shadow-skeuo-modal max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#d1d9e6]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-sm font-bold text-text-primary font-mono">
                  Document Preview: {ocrResult?.originalFilename}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="skeuo-btn p-1.5 rounded-lg text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto my-4 flex items-center justify-center min-h-[400px] skeuo-recessed rounded-xl p-4">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-2 text-xs font-mono text-text-muted">
                  <RefreshCw className="w-6 h-6 animate-spin text-accent-cyan" />
                  <span>Loading secure document preview...</span>
                </div>
              ) : previewBlobUrl ? (
                selectedFile?.type?.includes('pdf') || ocrResult?.originalFilename?.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewBlobUrl}
                    title="Document Scan Preview"
                    className="w-full h-[65vh] rounded-lg border border-[#babecc]"
                  />
                ) : (
                  <img
                    src={previewBlobUrl}
                    alt="Document Scan Preview"
                    className="max-h-[65vh] object-contain rounded-lg shadow-sm"
                  />
                )
              ) : (
                <div className="text-xs font-mono text-[#d63031] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Unable to render document preview. Document may be restricted or unavailable.</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#d1d9e6] flex items-center justify-between text-xs font-mono">
              <span className="text-text-muted">Protected Regulatory Document • Server-Side Session Verified</span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="skeuo-btn px-4 py-2 rounded-xl text-xs font-bold text-text-primary"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default DocumentUploadOcr;

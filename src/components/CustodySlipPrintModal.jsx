import React, { useRef } from 'react';
import {
  Printer,
  X,
  Shield,
  Lock,
  Building,
  Landmark,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { formatINR, formatDate } from '../data/sampleFdrData';

// Helper to convert number to words in Indian Lakhs/Crores
function amountToWords(amount) {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const num = Math.round(Number(amount));
  if (num === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit > 0 ? ' ' + units[unit] : '');
  }

  function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) res += units[hundred] + ' Hundred';
    if (rest > 0) res += (res ? ' ' : '') + convertTwoDigits(rest);
    return res;
  }

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = num % 1000;

  const parts = [];
  if (crore > 0) parts.push(convertThreeDigits(crore) + ' Crore');
  if (lakh > 0) parts.push(convertThreeDigits(lakh) + ' Lakh');
  if (thousand > 0) parts.push(convertThreeDigits(thousand) + ' Thousand');
  if (hundred > 0) parts.push(convertThreeDigits(hundred));

  return 'Rupees ' + parts.join(' ') + ' Only';
}

export function CustodySlipPrintModal({ record, onClose }) {
  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const printDate = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop (hidden during print) */}
      <div
        className="fixed inset-0 bg-[#2d3436]/60 backdrop-blur-sm transition-opacity print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl skeuo-panel-elevated shadow-skeuo-modal my-6 z-10 overflow-hidden border-2 border-white/90 print:border-none print:shadow-none print:p-0 print:my-0 print:w-full print:max-w-none">
        
        {/* Screws (hidden during print) */}
        <span className="screw-head absolute top-3 left-3 opacity-90 print:hidden" />
        <span className="screw-head absolute top-3 right-3 opacity-90 print:hidden" />

        {/* Action Header Bar (hidden during print) */}
        <div className="px-6 py-3.5 bg-[#e8edf4] border-b border-[#d1d9e6] flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-accent-orange" />
            <span className="text-xs font-mono font-bold text-text-primary uppercase">
              Official Custody Slip — Print Preview
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1b7943]/15 text-[#1b7943] font-bold border border-[#1b7943]/30">
              LEGAL VAULT RECORD
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="skeuo-btn-accent px-4 py-1.5 text-xs font-mono rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Custody Slip</span>
            </button>
            <button
              onClick={onClose}
              className="skeuo-btn p-1.5 rounded-lg text-text-muted hover:text-text-primary"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div
          id="printable-custody-slip"
          className="p-8 bg-white text-gray-900 font-sans max-h-[calc(85vh-100px)] overflow-y-auto print:max-h-none print:overflow-visible print:p-8"
        >
          {/* Government Emblem / AICTE Header */}
          <div className="text-center pb-5 border-b-2 border-gray-800">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-6 h-6 text-gray-800" />
              <h1 className="text-lg font-extrabold uppercase tracking-wide text-gray-900">
                All India Council for Technical Education
              </h1>
            </div>
            <p className="text-xs font-semibold uppercase text-gray-600">
              (A Statutory Body of the Government of India &bull; Ministry of Education)
            </p>
            <p className="text-[11px] font-mono text-gray-600 mt-0.5">
              Nelson Mandela Marg, Vasant Kunj, New Delhi &ndash; 110070
            </p>
            <div className="mt-2.5 inline-block px-3 py-1 bg-gray-100 border border-gray-400 rounded text-xs font-bold font-mono uppercase tracking-wider text-gray-900">
              Tripartite FDR Safe Custody Endorsement Slip
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 gap-4 my-4 py-2 text-xs font-mono border-b border-gray-300">
            <div>
              <span className="text-gray-500">CUSTODY RECEIPT SERIAL:</span>
              <p className="font-bold text-gray-900">CS-AICTE-{record.id}-{record.reference}</p>
            </div>
            <div className="text-right">
              <span className="text-gray-500">ISSUED & VERIFIED AT:</span>
              <p className="font-bold text-gray-900">{printDate}</p>
            </div>
          </div>

          {/* Section 1: Institution Details */}
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider bg-gray-100 px-3 py-1 border-l-4 border-gray-800 text-gray-800 mb-2">
              1. Institutional Particulars
            </h3>
            <table className="w-full text-xs font-sans border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600 w-1/3">Name of Institution:</td>
                  <td className="py-1.5 font-bold text-gray-900">{record.institution}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Permanent Institute ID (PID):</td>
                  <td className="py-1.5 font-mono font-bold text-gray-900">{record.institutionCode}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Sponsoring Trust / Society:</td>
                  <td className="py-1.5 text-gray-900">{record.trust || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Jurisdiction / Regional Office:</td>
                  <td className="py-1.5 text-gray-900">{record.state} &bull; {record.region || 'Northern Regional Office'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Fixed Deposit Particulars */}
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider bg-gray-100 px-3 py-1 border-l-4 border-gray-800 text-gray-800 mb-2">
              2. Fixed Deposit Receipt (FDR) Particulars
            </h3>
            <table className="w-full text-xs font-sans border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600 w-1/3">FDR Reference Number:</td>
                  <td className="py-1.5 font-mono font-bold text-gray-900">{record.reference}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Bank Certificate Serial No:</td>
                  <td className="py-1.5 font-mono font-bold text-gray-900">{record.certificateNo || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Pledging Scheduled Bank:</td>
                  <td className="py-1.5 font-semibold text-gray-900">{record.bankName}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Branch Location & IFSC:</td>
                  <td className="py-1.5 text-gray-900">{record.branch} (IFSC: <span className="font-mono font-bold">{record.ifsc}</span>)</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Principal Deposit Amount:</td>
                  <td className="py-1.5 text-sm font-bold font-mono text-gray-900">
                    {formatINR(record.depositAmount)}
                    <span className="block text-xs font-normal font-sans italic text-gray-700 mt-0.5">
                      ({amountToWords(record.depositAmount)})
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Contracted Interest Rate:</td>
                  <td className="py-1.5 font-mono text-gray-900">{record.interestRate || 'N/A'} p.a.</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Deposit Issue Date:</td>
                  <td className="py-1.5 font-mono text-gray-900">{formatDate(record.issueDate)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Maturity Date:</td>
                  <td className="py-1.5 font-mono font-bold text-gray-900">{formatDate(record.maturityDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Statutory Lien & Custody Status */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider bg-gray-100 px-3 py-1 border-l-4 border-gray-800 text-gray-800 mb-2">
              3. Regulatory Lien Endorsement & Safe Custody
            </h3>
            <table className="w-full text-xs font-sans border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600 w-1/3">Joint Account Lien Holder:</td>
                  <td className="py-1.5 font-semibold text-gray-900">{record.jointLienHolder || 'Member Secretary, AICTE New Delhi'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Lien Endorsement Status:</td>
                  <td className="py-1.5 font-semibold text-gray-900">{record.lienStatus || 'Lien Marked to AICTE'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Physical Vault Location:</td>
                  <td className="py-1.5 font-mono text-gray-900">{record.physicalLocation || 'Regulation Bureau Safe Vault'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 font-semibold text-gray-600">Verification & Audit Status:</td>
                  <td className="py-1.5 text-gray-900">
                    <span className="font-bold">{record.verificationStatus}</span> (Last Audited: {formatDate(record.lastAudited)})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Statutory Mandate Note */}
          <div className="p-3 bg-gray-50 border border-gray-300 rounded text-[11px] text-gray-700 leading-relaxed mb-8">
            <strong>REGULATORY NOTICE:</strong> This fixed deposit instrument is pledged under irrevocable tripartite lien to the AICTE under the AICTE Approval Process Hand Book (APH). The issuing bank is strictly prohibited from executing premature closure, auto-liquidation, credit overdraft, or lien lifting without explicit written sanction order signed by the Competent Authority, AICTE Regulation Bureau.
          </div>

          {/* Dual Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-gray-400 text-xs font-sans">
            <div className="text-center">
              <div className="h-12 border-b border-dashed border-gray-400 mb-2" />
              <p className="font-bold text-gray-900">Authorized Custodian Signature</p>
              <p className="text-[10px] text-gray-600">AICTE Regulation Bureau &bull; New Delhi</p>
            </div>
            <div className="text-center">
              <div className="h-12 border-b border-dashed border-gray-400 mb-2" />
              <p className="font-bold text-gray-900">Bank Verification Endorsement Seal</p>
              <p className="text-[10px] text-gray-600">Branch Manager / Authorized Signatory</p>
            </div>
          </div>

        </div>

        {/* Modal Footer (hidden during print) */}
        <div className="px-6 py-3 bg-[#e8edf4] border-t border-[#d1d9e6] flex items-center justify-between text-xs font-mono text-text-muted print:hidden">
          <span>AICTE Security Seal #894-REG</span>
          <button
            onClick={onClose}
            className="skeuo-btn px-4 py-1.5 rounded-lg text-text-primary"
          >
            Close Preview
          </button>
        </div>

      </div>

      {/* Print CSS to isolate printable slip */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-custody-slip, #printable-custody-slip * {
            visibility: visible;
          }
          #printable-custody-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}

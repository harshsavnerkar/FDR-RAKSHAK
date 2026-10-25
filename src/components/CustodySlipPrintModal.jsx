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
  FileText,
  Download
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
    const printContent = document.getElementById('printable-custody-slip');
    if (!printContent) {
      window.print();
      return;
    }

    // Collect all stylesheets and style blocks from current document
    const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    // Create or reuse isolated hidden iframe
    let iframe = document.getElementById('print-custody-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-custody-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>AICTE_Custody_Slip_${record.reference || 'Official'}</title>
          ${headStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 7mm 10mm 7mm 10mm;
            }
            html, body {
              background: #ffffff !important;
              color: #111827 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              height: 100% !important;
              max-height: 100% !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .custody-print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111827 !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            #printable-custody-slip {
              max-height: none !important;
              overflow: hidden !important;
              padding: 2px 4px !important;
              background: #ffffff !important;
              color: #111827 !important;
              border: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            td {
              color: #111827 !important;
              padding: 1.5px 0 !important;
              font-size: 10px !important;
              line-height: 1.25 !important;
            }
            .text-gray-500 { color: #6b7280 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-700 { color: #374151 !important; }
            .text-gray-800 { color: #1f2937 !important; }
            .text-gray-900 { color: #111827 !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-gray-100 { background-color: #f3f4f6 !important; }
          </style>
        </head>
        <body>
          <div class="custody-print-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Settle styles then print
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Iframe print error, falling back to window.print():', err);
        window.print();
      }
    }, 300);
  };

  const handleExportHtml = () => {
    const printContent = document.getElementById('printable-custody-slip');
    if (!printContent) return;

    const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AICTE_Custody_Slip_${record.reference || 'Official'}</title>
  ${headStyles}
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { background: #ffffff; color: #111827; margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .custody-print-container { max-width: 800px; margin: 0 auto; }
    #printable-custody-slip { max-height: none !important; overflow: visible !important; }
  </style>
</head>
<body>
  <div class="custody-print-container">
    ${printContent.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AICTE_Custody_Slip_${record.reference || record.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
              onClick={handleExportHtml}
              className="skeuo-btn px-3 py-1.5 text-xs font-mono rounded-lg shadow-sm flex items-center gap-1.5 text-text-primary hover:text-accent-orange"
              title="Download standalone HTML certificate"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export HTML</span>
            </button>
            <button
              onClick={handlePrint}
              className="skeuo-btn-accent px-4 py-1.5 text-xs font-mono rounded-lg shadow-sm flex items-center gap-1.5"
              title="Print directly or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
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
          className="p-5 sm:p-6 bg-white text-gray-900 font-sans max-h-[calc(85vh-100px)] overflow-y-auto print:max-h-none print:overflow-visible print:p-2"
        >
          {/* Government Emblem / AICTE Header */}
          <div className="text-center pb-2 border-b-2 border-gray-800">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Shield className="w-5 h-5 text-gray-800 flex-shrink-0" />
              <h1 className="text-base font-extrabold uppercase tracking-wide text-gray-900">
                All India Council for Technical Education
              </h1>
            </div>
            <p className="text-[10px] font-semibold uppercase text-gray-600">
              (A Statutory Body of the Government of India &bull; Ministry of Education)
            </p>
            <p className="text-[9px] font-mono text-gray-600">
              Nelson Mandela Marg, Vasant Kunj, New Delhi &ndash; 110070
            </p>
            <div className="mt-1 inline-block px-2.5 py-0.5 bg-gray-100 border border-gray-400 rounded text-[10px] font-bold font-mono uppercase tracking-wider text-gray-900">
              Tripartite FDR Safe Custody Endorsement Slip
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 gap-4 my-2 py-1 text-[10.5px] font-mono border-b border-gray-300">
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
          <div className="mb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 border-l-4 border-gray-800 text-gray-800 mb-1">
              1. Institutional Particulars
            </h3>
            <table className="w-full text-[10.5px] font-sans border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600 w-1/3">Name of Institution:</td>
                  <td className="py-0.5 font-bold text-gray-900">{record.institution}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Permanent Institute ID (PID):</td>
                  <td className="py-0.5 font-mono font-bold text-gray-900">{record.institutionCode}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Sponsoring Trust / Society:</td>
                  <td className="py-0.5 text-gray-900">{record.trust || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Jurisdiction / Regional Office:</td>
                  <td className="py-0.5 text-gray-900">{record.state} &bull; {record.region || 'Western Regional Office (WRO)'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Fixed Deposit Particulars */}
          <div className="mb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 border-l-4 border-gray-800 text-gray-800 mb-1">
              2. Fixed Deposit Receipt (FDR) Particulars
            </h3>
            <table className="w-full text-[10.5px] font-sans border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600 w-1/3">FDR Reference Number:</td>
                  <td className="py-0.5 font-mono font-bold text-gray-900">{record.reference}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Bank Certificate Serial No:</td>
                  <td className="py-0.5 font-mono font-bold text-gray-900">{record.certificateNo || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Pledging Scheduled Bank:</td>
                  <td className="py-0.5 font-semibold text-gray-900">{record.bankName}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Branch Location & IFSC:</td>
                  <td className="py-0.5 text-gray-900">{record.branch} (IFSC: <span className="font-mono font-bold">{record.ifsc}</span>)</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Principal Deposit Amount:</td>
                  <td className="py-0.5 font-bold font-mono text-gray-900">
                    {formatINR(record.depositAmount)}
                    <span className="ml-2 font-normal font-sans italic text-gray-700 text-[9.5px]">
                      ({amountToWords(record.depositAmount)})
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Contracted Interest Rate:</td>
                  <td className="py-0.5 font-mono text-gray-900">{record.interestRate || 'N/A'} p.a.</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Deposit Issue Date:</td>
                  <td className="py-0.5 font-mono text-gray-900">{formatDate(record.issueDate)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Maturity Date:</td>
                  <td className="py-0.5 font-mono font-bold text-gray-900">{formatDate(record.maturityDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Statutory Lien & Custody Status */}
          <div className="mb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 border-l-4 border-gray-800 text-gray-800 mb-1">
              3. Regulatory Lien Endorsement & Safe Custody
            </h3>
            <table className="w-full text-[10.5px] font-sans border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600 w-1/3">Joint Account Lien Holder:</td>
                  <td className="py-0.5 font-semibold text-gray-900">{record.jointLienHolder || 'Member Secretary, AICTE New Delhi'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Lien Endorsement Status:</td>
                  <td className="py-0.5 font-semibold text-gray-900">{record.lienStatus || 'Lien Marked to AICTE'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Physical Vault Location:</td>
                  <td className="py-0.5 font-mono text-gray-900">{record.physicalLocation || 'Regulation Bureau Safe Vault'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-0.5 font-semibold text-gray-600">Verification & Audit Status:</td>
                  <td className="py-0.5 text-gray-900">
                    <span className="font-bold">{record.verificationStatus}</span> (Last Audited: {formatDate(record.lastAudited)})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Statutory Mandate Note */}
          <div className="p-2 bg-gray-50 border border-gray-300 rounded text-[9px] text-gray-700 leading-tight mb-2">
            <strong>REGULATORY NOTICE:</strong> Pledged under irrevocable tripartite lien to AICTE under Approval Process Hand Book (APH). The issuing bank is strictly prohibited from executing premature closure, auto-liquidation, credit overdraft, or lien lifting without explicit written sanction order signed by the Competent Authority, AICTE Regulation Bureau.
          </div>

          {/* Dual Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-2 border-t-2 border-gray-400 text-[10px] font-sans">
            <div className="text-center">
              <div className="h-7 border-b border-dashed border-gray-400 mb-1" />
              <p className="font-bold text-gray-900">Authorized Custodian Signature</p>
              <p className="text-[9px] text-gray-600">AICTE Regulation Bureau &bull; New Delhi</p>
            </div>
            <div className="text-center">
              <div className="h-7 border-b border-dashed border-gray-400 mb-1" />
              <p className="font-bold text-gray-900">Bank Verification Endorsement Seal</p>
              <p className="text-[9px] text-gray-600">Branch Manager / Authorized Signatory</p>
            </div>
          </div>

        </div>

        {/* Modal Footer (hidden during print) */}
        <div className="px-6 py-3 bg-[#e8edf4] border-t border-[#d1d9e6] flex items-center justify-between text-xs font-mono text-text-muted print:hidden">
          <span>AICTE Security Seal #894-REG</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportHtml}
              className="skeuo-btn px-3 py-1.5 rounded-lg text-text-primary flex items-center gap-1.5 hover:text-accent-orange"
              title="Download standalone HTML certificate"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Certificate</span>
            </button>
            <button
              onClick={handlePrint}
              className="skeuo-btn-accent px-4 py-1.5 rounded-lg text-white flex items-center gap-1.5 shadow-sm"
              title="Print directly or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="skeuo-btn px-4 py-1.5 rounded-lg text-text-primary"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* Print CSS to isolate printable slip for fallback direct print */}
      <style>{`
        @media print {
          html, body, #root, #root > div {
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            position: static !important;
            background: #ffffff !important;
          }
          .print\\:hidden,
          .print\\:hidden * {
            display: none !important;
          }
          #printable-custody-slip {
            display: block !important;
            position: static !important;
            max-height: none !important;
            overflow: visible !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            background: #ffffff !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

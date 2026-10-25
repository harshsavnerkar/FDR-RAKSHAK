/**
 * Utility functions for exporting tabular and analytics data to CSV
 * with proper escaping and automatic download triggering.
 */

/**
 * Safely escapes CSV cell content and neutralizes spreadsheet formula injection (CWE-1236).
 * Values starting with =, +, -, @, tab, or carriage return are prefixed with a single quote.
 */
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Neutralize spreadsheet formula injection characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportFdrsToCsv(records, filename = 'FDR_SmartGuard_Vault_Ledger.csv') {
  if (!records || !records.length) {
    alert('No records available to export.');
    return;
  }

  const headers = [
    'Reference Number',
    'Institution Name',
    'Institution Code',
    'Trust / Society',
    'State / UT',
    'Region',
    'Issuing Bank',
    'Branch',
    'IFSC Code',
    'Certificate No',
    'Deposit Amount (INR)',
    'Interest Rate',
    'Issue Date',
    'Maturity Date',
    'Verification Status',
    'Priority',
    'Lifecycle Status',
    'Joint Lien Holder',
    'Lien Status',
    'Physical Custody Location'
  ];

  const rows = records.map((r) => [
    sanitizeCsvCell(r.reference),
    sanitizeCsvCell(r.institution),
    sanitizeCsvCell(r.institutionCode),
    sanitizeCsvCell(r.trust),
    sanitizeCsvCell(r.state),
    sanitizeCsvCell(r.region),
    sanitizeCsvCell(r.bankName),
    sanitizeCsvCell(r.branch),
    sanitizeCsvCell(r.ifsc),
    sanitizeCsvCell(r.certificateNo),
    sanitizeCsvCell(r.depositAmount),
    sanitizeCsvCell(r.interestRate),
    sanitizeCsvCell(r.issueDate),
    sanitizeCsvCell(r.maturityDate),
    sanitizeCsvCell(r.verificationStatus),
    sanitizeCsvCell(r.priority),
    sanitizeCsvCell(r.lifecycleStatus || 'ACTIVE'),
    sanitizeCsvCell(r.jointLienHolder),
    sanitizeCsvCell(r.lienStatus),
    sanitizeCsvCell(r.physicalLocation)
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportInstitutionsToCsv(institutions, filename = 'AICTE_Institutional_Registry.csv') {
  if (!institutions || !institutions.length) {
    alert('No institution records available to export.');
    return;
  }

  const headers = [
    'Institution PID',
    'Institution Name',
    'Type',
    'Trust / Society',
    'State / UT',
    'City',
    'Pincode',
    'Affiliation Authority',
    'Contact Email',
    'Contact Phone'
  ];

  const rows = institutions.map((i) => [
    sanitizeCsvCell(i.code),
    sanitizeCsvCell(i.name),
    sanitizeCsvCell(i.type),
    sanitizeCsvCell(i.trust),
    sanitizeCsvCell(i.state),
    sanitizeCsvCell(i.city),
    sanitizeCsvCell(i.pincode),
    sanitizeCsvCell(i.affiliationAuthority),
    sanitizeCsvCell(i.contactEmail),
    sanitizeCsvCell(i.contactPhone)
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

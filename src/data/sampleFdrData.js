/**
 * Sample Fixed Deposit Receipt (FDR) records for AICTE Regulation Bureau.
 * Demo/Mock administrative records.
 */

export const SAMPLE_FDR_RECORDS = [
  {
    id: "FDR-2024-9102",
    reference: "FDR-AICTE-2024-9102",
    institution: "Sardar Patel Institute of Technology",
    institutionCode: "SPIT-MH-019",
    trust: "Bharatiya Vidya Bhavan",
    state: "Maharashtra",
    region: "WRO Mumbai",
    depositAmount: 3500000,
    currency: "INR",
    interestRate: "7.15%",
    issueDate: "2021-11-15",
    maturityDate: "2026-11-15",
    verificationStatus: "Expiring Soon",
    priority: "High",
    bankName: "State Bank of India",
    branch: "Andheri West, Mumbai",
    ifsc: "SBIN0001823",
    certificateNo: "SBI-FDR-889021-MUM",
    jointLienHolder: "Member Secretary AICTE & Principal SPIT",
    lienStatus: "Active Lien to AICTE",
    ocrConfidence: 99.1,
    physicalLocation: "Vault-02 / Shelf B-14 / Locker 41",
    discrepancyNote: "Maturity due in 23 days. Automatic renewal clause absent; Renewal Notice Rev-1 dispatched.",
    lastAudited: "2026-10-18",
    category: "Technical Degree (UG/PG)"
  },
  {
    id: "FDR-2023-4418",
    reference: "FDR-AICTE-2023-4418",
    institution: "Vivekananda College of Engineering & Tech",
    institutionCode: "VCET-KA-112",
    trust: "Vivekananda Vidya Vardhaka Sangha",
    state: "Karnataka",
    region: "SWRO Bangalore",
    depositAmount: 5000000,
    currency: "INR",
    interestRate: "6.90%",
    issueDate: "2020-04-10",
    maturityDate: "2026-10-12",
    verificationStatus: "Discrepancy",
    priority: "Critical",
    bankName: "Canara Bank",
    branch: "Puttur Main, Mangalore",
    ifsc: "CNRB0000521",
    certificateNo: "CNRB-FDR-99210-PTR",
    jointLienHolder: "Regional Officer AICTE SWRO & Principal VCET",
    lienStatus: "Maturity Overdue - Unrenewed",
    ocrConfidence: 84.2,
    physicalLocation: "Vault-01 / Shelf C-03 / Locker 18",
    discrepancyNote: "CRITICAL: Maturity lapsed 11 days ago without auto-rollover confirmation from issuing branch.",
    lastAudited: "2026-10-21",
    category: "Engineering & Technology"
  },
  {
    id: "FDR-2024-8841",
    reference: "FDR-AICTE-2024-8841",
    institution: "Delhi Institute of Technical Education",
    institutionCode: "DITE-DL-004",
    trust: "Delhi DTTE Society",
    state: "Delhi NCT",
    region: "NWRO New Delhi",
    depositAmount: 10000000,
    currency: "INR",
    interestRate: "7.40%",
    issueDate: "2022-03-20",
    maturityDate: "2027-03-20",
    verificationStatus: "Verified",
    priority: "Standard",
    bankName: "Punjab National Bank",
    branch: "Okhla Industrial Area, New Delhi",
    ifsc: "PUNB0124300",
    certificateNo: "PNB-SEC-77192-DEL",
    jointLienHolder: "Director AICTE & Director DITE",
    lienStatus: "Valid Tripartite Lien Marked",
    ocrConfidence: 99.8,
    physicalLocation: "Vault-01 / Shelf A-01 / Locker 05",
    discrepancyNote: "Security deposit parameters and bank joint endorsement verified against CBS depository portal.",
    lastAudited: "2026-09-30",
    category: "Polytechnic / Applied Arts"
  },
  {
    id: "FDR-2025-1039",
    reference: "FDR-AICTE-2025-1039",
    institution: "PSG Institute of Applied Technology",
    institutionCode: "PSGI-TN-087",
    trust: "PSG & Sons Charities",
    state: "Tamil Nadu",
    region: "SRO Chennai",
    depositAmount: 7500000,
    currency: "INR",
    interestRate: "7.25%",
    issueDate: "2023-08-01",
    maturityDate: "2028-08-01",
    verificationStatus: "Verified",
    priority: "Standard",
    bankName: "Bank of Baroda",
    branch: "Peelamedu, Coimbatore",
    ifsc: "BARB0PEELAM",
    certificateNo: "BOB-FD-441829-CBE",
    jointLienHolder: "Regional Officer AICTE SRO & Principal PSG",
    lienStatus: "Valid Tripartite Lien Marked",
    ocrConfidence: 98.7,
    physicalLocation: "Vault-02 / Shelf D-08 / Locker 72",
    discrepancyNote: "Certificate fully validated. 5-year security lock-in in order.",
    lastAudited: "2026-10-10",
    category: "Autonomous Engineering College"
  },
  {
    id: "FDR-2024-7720",
    reference: "FDR-AICTE-2024-7720",
    institution: "K.J. Somaiya Polytechnic",
    institutionCode: "KJSP-MH-055",
    trust: "Somaiya Vidyavihar Trust",
    state: "Maharashtra",
    region: "WRO Mumbai",
    depositAmount: 2500000,
    currency: "INR",
    interestRate: "7.00%",
    issueDate: "2024-01-14",
    maturityDate: "2026-11-28",
    verificationStatus: "Expiring Soon",
    priority: "High",
    bankName: "Union Bank of India",
    branch: "Vidyavihar, Mumbai",
    ifsc: "UBIN0542318",
    certificateNo: "UBI-FDR-31094-VVR",
    jointLienHolder: "Member Secretary AICTE & Principal KJSP",
    lienStatus: "Active Lien to AICTE",
    ocrConfidence: 96.5,
    physicalLocation: "Vault-02 / Shelf B-05 / Locker 33",
    discrepancyNote: "Maturity due in 36 days. First renewal notice issued to institute registrar.",
    lastAudited: "2026-10-15",
    category: "Diploma Engineering"
  },
  {
    id: "FDR-2024-6512",
    reference: "FDR-AICTE-2024-6512",
    institution: "Maulana Azad College of Engineering",
    institutionCode: "MACE-UP-143",
    trust: "Azad Educational Society",
    state: "Uttar Pradesh",
    region: "NRO Kanpur",
    depositAmount: 4000000,
    currency: "INR",
    interestRate: "6.85%",
    issueDate: "2024-09-10",
    maturityDate: "2029-09-10",
    verificationStatus: "Pending",
    priority: "Medium",
    bankName: "HDFC Bank",
    branch: "Hazratganj, Lucknow",
    ifsc: "HDFC0000049",
    certificateNo: "HDFC-FDR-90281-LKO",
    jointLienHolder: "Awaiting Joint Signatory Endorsement",
    lienStatus: "Lien Clause Verification Pending",
    ocrConfidence: 91.2,
    physicalLocation: "Intake Staging Desk / Tray 04",
    discrepancyNote: "Scanned copy submitted without Bank Branch Manager seal. Original certificate requested.",
    lastAudited: "2026-10-19",
    category: "Private Engineering Institution"
  },
  {
    id: "FDR-2024-5291",
    reference: "FDR-AICTE-2024-5291",
    institution: "Bengal Institute of Technology & Science",
    institutionCode: "BITS-WB-062",
    trust: "Techno India Educational Group",
    state: "West Bengal",
    region: "ERO Kolkata",
    depositAmount: 6000000,
    currency: "INR",
    interestRate: "7.10%",
    issueDate: "2022-06-15",
    maturityDate: "2027-06-15",
    verificationStatus: "Verified",
    priority: "Standard",
    bankName: "State Bank of India",
    branch: "Salt Lake Sector V, Kolkata",
    ifsc: "SBIN0008892",
    certificateNo: "SBI-CORP-44810-CCU",
    jointLienHolder: "Regional Officer AICTE ERO & Director BITS",
    lienStatus: "Valid Tripartite Lien Marked",
    ocrConfidence: 99.4,
    physicalLocation: "Vault-01 / Shelf D-12 / Locker 58",
    discrepancyNote: "Valid 5-year security deposit receipt in Regulation Bureau physical custody.",
    lastAudited: "2026-08-14",
    category: "Technical Degree (UG/PG)"
  },
  {
    id: "FDR-2023-3890",
    reference: "FDR-AICTE-2023-3890",
    institution: "Indira Institute of Management & Science",
    institutionCode: "IIMS-MH-219",
    trust: "Shree Chanakya Education Society",
    state: "Maharashtra",
    region: "WRO Mumbai",
    depositAmount: 3000000,
    currency: "INR",
    interestRate: "6.75%",
    issueDate: "2021-09-05",
    maturityDate: "2026-09-05",
    verificationStatus: "Discrepancy",
    priority: "Critical",
    bankName: "ICICI Bank",
    branch: "Wakad, Pune",
    ifsc: "ICIC0001004",
    certificateNo: "ICIC-FDR-81044-PUN",
    jointLienHolder: "Member Secretary AICTE & President SCES",
    lienStatus: "Maturity Overdue - Unrenewed",
    ocrConfidence: 87.0,
    physicalLocation: "Vault-01 / Shelf C-09 / Locker 27",
    discrepancyNote: "CRITICAL: Maturity lapsed 48 days ago. Show Cause Notice served under AICTE Approval Process Hand Book.",
    lastAudited: "2026-10-22",
    category: "Management Institute (MBA/PGDM)"
  },
  {
    id: "FDR-2024-2104",
    reference: "FDR-AICTE-2024-2104",
    institution: "Kalinga Institute of Industrial Science",
    institutionCode: "KIIS-OD-034",
    trust: "Kalinga Educational Foundation",
    state: "Odisha",
    region: "ERO Kolkata",
    depositAmount: 5000000,
    currency: "INR",
    interestRate: "7.30%",
    issueDate: "2024-05-20",
    maturityDate: "2029-05-20",
    verificationStatus: "Pending",
    priority: "Medium",
    bankName: "Canara Bank",
    branch: "Saheed Nagar, Bhubaneswar",
    ifsc: "CNRB0001844",
    certificateNo: "CNRB-FDR-55319-BBI",
    jointLienHolder: "AICTE Regional Officer & Trustee",
    lienStatus: "Bank Lien Letter Verification in Progress",
    ocrConfidence: 93.8,
    physicalLocation: "Intake Staging Desk / Tray 02",
    discrepancyNote: "Deposit for new UG course sanctions. Bank confirmation letter verification pending with branch.",
    lastAudited: "2026-10-12",
    category: "Engineering & Applied Sciences"
  },
  {
    id: "FDR-2024-1188",
    reference: "FDR-AICTE-2024-1188",
    institution: "Gujarat Technological Polytechnic",
    institutionCode: "GTP-GJ-089",
    trust: "Gujarat Technical Development Board",
    state: "Gujarat",
    region: "CRO Vadodara",
    depositAmount: 2000000,
    currency: "INR",
    interestRate: "7.20%",
    issueDate: "2023-12-01",
    maturityDate: "2028-12-01",
    verificationStatus: "Verified",
    priority: "Standard",
    bankName: "Bank of Baroda",
    branch: "Ashram Road, Ahmedabad",
    ifsc: "BARB0ASHRAM",
    certificateNo: "BOB-FDR-11849-AMD",
    jointLienHolder: "Regional Officer AICTE CRO & Principal GTP",
    lienStatus: "Valid Tripartite Lien Marked",
    ocrConfidence: 98.9,
    physicalLocation: "Vault-02 / Shelf E-03 / Locker 64",
    discrepancyNote: "5-year security deposit verified against state treasury bond protocol.",
    lastAudited: "2026-09-18",
    category: "Diploma Polytechnic"
  }
];

/**
 * Derives dynamic summary counts and values from the record set.
 */
export function calculateFdrSummary(records = SAMPLE_FDR_RECORDS) {
  const total = records.length;
  const totalAmount = records.reduce((sum, r) => sum + r.depositAmount, 0);

  // Expiring soon: status is 'Expiring Soon' or maturity within 45 days
  const expiringSoon = records.filter(r => r.verificationStatus === "Expiring Soon").length;

  // Pending verification: status is 'Pending'
  const pendingVerification = records.filter(r => r.verificationStatus === "Pending").length;

  // Overdue / Discrepancy cases:
  // Fictional current reference date is October 2026
  const overdueCases = records.filter(r => {
    return r.verificationStatus === "Discrepancy" || r.priority === "Critical" || new Date(r.maturityDate) < new Date("2026-10-23");
  }).length;

  const verifiedCount = records.filter(r => r.verificationStatus === "Verified").length;

  return {
    total,
    totalAmount,
    expiringSoon,
    pendingVerification,
    overdueCases,
    verifiedCount
  };
}

/**
 * Format Indian Rupee currency: e.g. ₹35,00,000 or ₹3.50 Cr
 */
export function formatINR(amount, compact = false) {
  if (typeof amount !== 'number') return '₹0';
  
  if (compact) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakh`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formats ISO date to readable administrative format: "15-Nov-2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Mock Recent Activity Feed for AICTE Regulation Bureau audit log
 */
export const SAMPLE_ACTIVITY_FEED = [
  {
    id: "act-1",
    timestamp: "10 mins ago",
    type: "ocr",
    action: "AI OCR Pipeline completed automatic extraction for SPIT-MH-019 (SBI-FDR-889021-MUM).",
    severity: "success",
    user: "System (AI OCR Engine v2.4)"
  },
  {
    id: "act-2",
    timestamp: "35 mins ago",
    type: "alert",
    action: "Critical Overdue Alert dispatched to VCET Puttur (Maturity lapsed: 12-Oct-2026).",
    severity: "critical",
    user: "Alert Daemon"
  },
  {
    id: "act-3",
    timestamp: "2 hours ago",
    type: "review",
    action: "Physical custody scan matched against PNB FDR for Delhi Institute of Tech Education.",
    severity: "info",
    user: "Officer S. Deshmukh"
  },
  {
    id: "act-4",
    timestamp: "4 hours ago",
    type: "notice",
    action: "Formal Show Cause notice draft prepared for Indira Institute (IIMS-MH-219).",
    severity: "warning",
    user: "Dr. R. K. Sharma (AICTE Admin)"
  },
  {
    id: "act-5",
    timestamp: "Yesterday, 17:40",
    type: "intake",
    action: "New intake deposit certificate uploaded for Maulana Azad College (HDFC Bank).",
    severity: "info",
    user: "Portal Inward Desk"
  }
];

/**
 * Upcoming maturity monthly distribution for charts
 */
export const UPCOMING_MATURITY_DATA = [
  { month: "Nov 2026", count: 2, amountInLakhs: 60, label: "60L (2 FDRs)" },
  { month: "Dec 2026", count: 1, amountInLakhs: 20, label: "20L (1 FDR)" },
  { month: "Jan 2027", count: 1, amountInLakhs: 45, label: "45L (1 FDR)" },
  { month: "Feb 2027", count: 2, amountInLakhs: 85, label: "85L (2 FDRs)" },
  { month: "Mar 2027", count: 3, amountInLakhs: 160, label: "1.6Cr (3 FDRs)" },
  { month: "Apr 2027", count: 1, amountInLakhs: 50, label: "50L (1 FDR)" }
];

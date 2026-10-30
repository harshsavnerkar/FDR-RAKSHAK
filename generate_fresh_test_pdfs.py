#!/usr/bin/env python3
"""
FDR RAKSHAK - EXTENDED TEST PDF GENERATOR (SUITE 2)
===================================================
Generates fresh, distinct test documents for live demonstrations:

SUITE A: Sardar Patel Institute of Technology (SPIT Mumbai - INST-SPIT-MH-019)
  - 05_SPIT_VALID_FDR_CERTIFICATE.pdf (Clean ₹50L, 5-Yr, Bank of Baroda)
  - 06_SPIT_DISCREPANCY_DEFICIT_FDR.pdf (Discrepancy: ₹40L, 2-Yr premature tenure)
  - 07_SPIT_BANK_CBS_CONFIRMATION_FEED.pdf (Bank CBS Confirmation Feed)
  - 08_SPIT_AICTE_SANCTION_RELEASE_ORDER.pdf (Statutory Sanction Order RO-AICTE-2026-SPIT-0089)

SUITE B: Delhi Institute of Technical Education (DITE New Delhi - INST-DITE-DL-004)
  - 09_DITE_VALID_FDR_CERTIFICATE.pdf (Clean ₹1.00 Cr, 5-Yr, Punjab National Bank)
  - 10_DITE_DISCREPANCY_DEFICIT_FDR.pdf (Discrepancy: ₹30L deficit, 18-month tenure)

SUITE C: Fresh Vidyalankar Re-test Set (VIT Mumbai - INST-VIT-MH-077)
  - 11_VIT_FRESH_VALID_FDR.pdf (Clean ₹50L fresh certificate FDR-AICTE-2026-9901)
  - 12_VIT_FRESH_SANCTION_ORDER.pdf (Fresh Sanction Order RO-AICTE-2026-VIT-0099)
"""

import os
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

SAMPLE_DIR = "sample_test_documents"
PUBLIC_DIR = "public/test_pdfs"

os.makedirs(SAMPLE_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

styles = getSampleStyleSheet()

# --- Common Reusable Styles ---
bank_header_bob = ParagraphStyle(
    'BankHeaderBOB',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=15,
    leading=18,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#d97706') # Bank of Baroda Orange
)

bank_header_pnb = ParagraphStyle(
    'BankHeaderPNB',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=15,
    leading=18,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#990033') # PNB Maroon
)

bank_header_sbi = ParagraphStyle(
    'BankHeaderSBI',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=15,
    leading=18,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#003366')
)

sub_header_style = ParagraphStyle(
    'SubHeader',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=12,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#333333')
)

title_style = ParagraphStyle(
    'CertTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=12,
    leading=15,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#1e293b')
)

title_disc_style = ParagraphStyle(
    'CertDiscTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=12,
    leading=15,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#c53030')
)

body_style = ParagraphStyle(
    'Body',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13,
    alignment=TA_LEFT,
    textColor=colors.HexColor('#1a1a1a')
)

lien_clause_style = ParagraphStyle(
    'LienClause',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=13,
    alignment=TA_JUSTIFY,
    textColor=colors.HexColor('#003366')
)

warning_style = ParagraphStyle(
    'WarnClause',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=13,
    alignment=TA_JUSTIFY,
    textColor=colors.HexColor('#c53030')
)

gov_header_style = ParagraphStyle(
    'GovHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=14,
    leading=17,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#4c1d95')
)

gov_sub_header_style = ParagraphStyle(
    'GovSubHeader',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=12,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#333333')
)

order_clause_style = ParagraphStyle(
    'OrderClause',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13,
    alignment=TA_JUSTIFY,
    textColor=colors.HexColor('#3b0764')
)


# =========================================================================
# 05: SPIT VALID FDR CERTIFICATE (Clean ₹50L, 5-Yr, Bank of Baroda)
# =========================================================================
def build_pdf_05(filepath):
    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []

    story.append(Paragraph("BANK OF BARODA", bank_header_bob))
    story.append(Paragraph("ANDHERI WEST BRANCH &bull; MUMBAI &bull; MAHARASHTRA 400058", sub_header_style))
    story.append(Paragraph("IFSC CODE: <b>BARB0ANDHER</b> &bull; MICR: 400012015 &bull; PHONE: +91 22 2628 3314", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#d97706'), spaceAfter=12))

    story.append(Paragraph("FIXED DEPOSIT RECEIPT &bull; STATUTORY REGULATORY SECURITY DEPOSIT", title_style))
    story.append(Paragraph("(Under AICTE Approval Process Handbook — Pledged Joint Lien Security)", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>Certificate Number:</b>", body_style),
            Paragraph("BOB-SPIT-2026-9101", body_style),
            Paragraph("<b>Bureau Reference:</b>", body_style),
            Paragraph("<b>FDR-AICTE-2026-9101</b>", body_style)
        ],
        [
            Paragraph("<b>Depositor Institution:</b>", body_style),
            Paragraph("<b>Sardar Patel Institute of Technology</b>", body_style),
            Paragraph("<b>AICTE PID / Code:</b>", body_style),
            Paragraph("<b>INST-SPIT-MH-019</b> (1-1049281)", body_style)
        ],
        [
            Paragraph("<b>Campus Address:</b>", body_style),
            Paragraph("Bhavan's Campus, Munshi Nagar, Andheri West, Mumbai 400058", body_style),
            Paragraph("<b>Discipline:</b>", body_style),
            Paragraph("Computer Engg & Technology (UG/PG)", body_style)
        ],
        [
            Paragraph("<b>Deposit Amount (INR):</b>", body_style),
            Paragraph("<b>INR 50,00,000.00</b><br/>(Rupees Fifty Lakhs Only)", body_style),
            Paragraph("<b>Interest Rate:</b>", body_style),
            Paragraph("7.30% p.a. (Quarterly Compounding)", body_style)
        ],
        [
            Paragraph("<b>Date of Issue:</b>", body_style),
            Paragraph("15-May-2026", body_style),
            Paragraph("<b>Date of Maturity:</b>", body_style),
            Paragraph("<b>15-May-2031</b> (Full 5-Year Mandatory Lock-in)", body_style)
        ],
        [
            Paragraph("<b>Joint Lien Holder:</b>", body_style),
            Paragraph("The Member Secretary, AICTE New Delhi", body_style),
            Paragraph("<b>Branch Code:</b>", body_style),
            Paragraph("ANDHER (Andheri West)", body_style)
        ]
    ]

    t = Table(table_data, colWidths=[130, 140, 120, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fffbeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fde68a')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    lien_box = [[
        Paragraph(
            "<b>STATUTORY TRIPARTITE LIEN UNDERTAKING (SARFAESI ACT & AICTE HANDBOOK):</b><br/>"
            "This Fixed Deposit is created by <b>Sardar Patel Institute of Technology (INST-SPIT-MH-019)</b> and held in joint custody with "
            "<b>The Member Secretary, AICTE New Delhi</b>. Bank of Baroda covenants that this corpus is non-transferable, "
            "non-encashable prior to 15-May-2031, and no loan or encumbrance shall be created without explicit tripartite sanction from AICTE.",
            lien_clause_style
        )
    ]]
    t_lien = Table(lien_box, colWidths=[520])
    t_lien.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#3b82f6')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_lien)
    story.append(Spacer(1, 24))

    sig_data = [
        [
            Paragraph("<b>For SARDAR PATEL INST. OF TECH.</b><br/><br/><br/>__________________________________<br/>Dr. B. N. Chaudhari &bull; Principal<br/>Munshi Nagar, Andheri West, Mumbai", body_style),
            Paragraph("<b>For BANK OF BARODA</b><br/><br/><br/>__________________________________<br/>Chief Manager / Branch Head<br/>Andheri West Branch &bull; IFSC: BARB0ANDHER", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('PADDING', (0,0), (-1,-1), 4)]))
    story.append(t_sig)

    doc.build(story)


# =========================================================================
# 06: SPIT DISCREPANCY DEFICIT FDR (₹40L, 2-Year Premature Tenure)
# =========================================================================
def build_pdf_06(filepath):
    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []

    story.append(Paragraph("BANK OF BARODA", bank_header_bob))
    story.append(Paragraph("ANDHERI WEST BRANCH &bull; MUMBAI &bull; MAHARASHTRA 400058", sub_header_style))
    story.append(Paragraph("IFSC CODE: <b>BARB0ANDHER</b>", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#c53030'), spaceAfter=12))

    story.append(Paragraph("FIXED DEPOSIT RECEIPT &bull; [STATUTORY DISCREPANCY TEST INSTRUMENT]", title_disc_style))
    story.append(Paragraph("TEST SCENARIO: ₹10 Lakhs Corpus Deficit & 2-Year Premature Maturity Variance", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>Certificate Number:</b>", body_style),
            Paragraph("BOB-SPIT-2026-DISC02", body_style),
            Paragraph("<b>Bureau Reference:</b>", body_style),
            Paragraph("<b>FDR-AICTE-2026-DISC02</b>", body_style)
        ],
        [
            Paragraph("<b>Depositor Institution:</b>", body_style),
            Paragraph("<b>Sardar Patel Institute of Technology</b>", body_style),
            Paragraph("<b>AICTE PID / Code:</b>", body_style),
            Paragraph("<b>INST-SPIT-MH-019</b> (1-1049281)", body_style)
        ],
        [
            Paragraph("<b>Campus Address:</b>", body_style),
            Paragraph("Munshi Nagar, Andheri West, Mumbai 400058", body_style),
            Paragraph("<b>Discipline:</b>", body_style),
            Paragraph("Engineering & Technology", body_style)
        ],
        [
            Paragraph("<b>Deposit Amount (INR):</b>", body_style),
            Paragraph("<font color='#c53030'><b>INR 40,00,000.00</b></font><br/>(Variance: Deficit of ₹10 Lakhs vs ₹50L norm)", body_style),
            Paragraph("<b>Interest Rate:</b>", body_style),
            Paragraph("7.10% p.a.", body_style)
        ],
        [
            Paragraph("<b>Date of Issue:</b>", body_style),
            Paragraph("15-May-2026", body_style),
            Paragraph("<b>Date of Maturity:</b>", body_style),
            Paragraph("<font color='#c53030'><b>15-May-2028</b></font><br/>(Variance: 2-Year Tenure vs 5-Year Norm)", body_style)
        ],
        [
            Paragraph("<b>Joint Lien Holder:</b>", body_style),
            Paragraph("The Member Secretary, AICTE New Delhi", body_style),
            Paragraph("<b>Branch Code:</b>", body_style),
            Paragraph("ANDHER", body_style)
        ]
    ]

    t = Table(table_data, colWidths=[130, 140, 120, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fff5f5')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fca5a5')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    warn_box = [[
        Paragraph(
            "<b>AICTE SENTRY ENGINE ALERT &bull; DISCREPANCY PROFILE:</b><br/>"
            "This instrument exhibits two critical regulatory compliance violations:<br/>"
            "1. <b>Tenure Deficit:</b> Maturity set to 15-May-2028 (24 Months). Fails Chapter I 5-year lock-in requirement.<br/>"
            "2. <b>Amount Variance:</b> Established for ₹40,00,000 instead of mandatory ₹50,00,000 (Shortfall: ₹10,00,000).<br/>"
            "FDR Rakshak Automated Sentry will highlight this in red and block unvetted clearance.",
            warning_style
        )
    ]]
    t_warn = Table(warn_box, colWidths=[520])
    t_warn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fee2e2')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#ef4444')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_warn)
    story.append(Spacer(1, 24))

    sig_data = [
        [
            Paragraph("<b>SARDAR PATEL INST. OF TECH.</b><br/><br/><br/>__________________________________<br/>Authorized Signatory & Seal", body_style),
            Paragraph("<b>BANK OF BARODA</b><br/><br/><br/>__________________________________<br/>Branch Manager & Seal &bull; BARB0ANDHER", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('PADDING', (0,0), (-1,-1), 4)]))
    story.append(t_sig)

    doc.build(story)


# =========================================================================
# 07: SPIT BANK CBS CONFIRMATION FEED (Bank of Baroda CBS Gateway)
# =========================================================================
def build_pdf_07(filepath):
    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    header_style = ParagraphStyle('BOBCBS', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=15, leading=18, alignment=TA_CENTER, textColor=colors.HexColor('#d97706'))
    cbs_box_style = ParagraphStyle('CbsClause', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13, alignment=TA_JUSTIFY, textColor=colors.HexColor('#92400e'))
    story = []

    story.append(Paragraph("BANK OF BARODA", header_style))
    story.append(Paragraph("CENTRAL CORE BANKING SYSTEM (CBS) &bull; INSTITUTIONAL NODAL HUB", sub_header_style))
    story.append(Paragraph("BARODA CORPORATE CENTRE, BANDRA KURLA COMPLEX, MUMBAI 400051", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#d97706'), spaceAfter=12))

    story.append(Paragraph("OFFICIAL CORE BANKING CONFIRMATION FEED &bull; LIEN RECORDING ACKNOWLEDGEMENT", title_style))
    story.append(Paragraph("Direct Cryptographic API Gateway Transmission to AICTE National Depository", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>CBS Transmission ID:</b>", body_style),
            Paragraph("BOB-CBS-2026-9101-FEED", body_style),
            Paragraph("<b>Transaction Date:</b>", body_style),
            Paragraph("15-May-2026 14:18:22 IST", body_style)
        ],
        [
            Paragraph("<b>Master FDR Reference:</b>", body_style),
            Paragraph("<b>FDR-AICTE-2026-9101</b>", body_style),
            Paragraph("<b>Core Account No:</b>", body_style),
            Paragraph("<b>BOB-910100482910</b>", body_style)
        ],
        [
            Paragraph("<b>Institution Name:</b>", body_style),
            Paragraph("<b>Sardar Patel Institute of Technology</b>", body_style),
            Paragraph("<b>Institution Code:</b>", body_style),
            Paragraph("INST-SPIT-MH-019", body_style)
        ],
        [
            Paragraph("<b>Confirmed Principal:</b>", body_style),
            Paragraph("<b>INR 50,00,000.00</b> (Fifty Lakhs)", body_style),
            Paragraph("<b>Verified Interest Rate:</b>", body_style),
            Paragraph("7.30% p.a.", body_style)
        ],
        [
            Paragraph("<b>Effective Issue Date:</b>", body_style),
            Paragraph("15-May-2026", body_style),
            Paragraph("<b>Mandatory Maturity Date:</b>", body_style),
            Paragraph("<b>15-May-2031</b>", body_style)
        ],
        [
            Paragraph("<b>CBS Lien State:</b>", body_style),
            Paragraph("<font color='#16a34a'><b>ACTIVE_AICTE_JOINT_LIEN</b></font>", body_style),
            Paragraph("<b>Branch Code & IFSC:</b>", body_style),
            Paragraph("BARB0ANDHER (Andheri W)", body_style)
        ]
    ]

    t = Table(table_data, colWidths=[130, 140, 120, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fffbeb')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fde68a')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    cbs_box = [[
        Paragraph(
            "<b>BANK CBS CONFIRMATION & LIEN MARKING COVENANT:</b><br/>"
            "Bank of Baroda hereby formally certifies through its Core Banking Solution (Finacle 10.x) that deposit account "
            "<b>BOB-910100482910</b> for <b>INR 50,00,000.00</b> is strictly ear-marked with Joint Lien in favour of "
            "<b>The Member Secretary, AICTE New Delhi</b>. Automated restraints are enabled on host CBS servers to reject any unauthorized debit, "
            "pre-mature closure, or credit pledge without valid AICTE digital clearance token.",
            cbs_box_style
        )
    ]]
    t_cbs = Table(cbs_box, colWidths=[520])
    t_cbs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef3c7')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#d97706')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_cbs)
    story.append(Spacer(1, 24))

    sig_data = [
        [
            Paragraph("<b>VERIFIED BY CBS AUTOMATION NODE</b><br/><br/><br/>Digital Signature Hash: <code>f8a2...319e</code><br/>BOB CBS Gateway Gateway Node 04", body_style),
            Paragraph("<b>BOB NODAL DESK CHIEF MANAGER</b><br/><br/><br/>__________________________________<br/>Shri Vivek Agarwal &bull; Chief Manager<br/>Bank of Baroda Treasury & Nodal Hub", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('PADDING', (0,0), (-1,-1), 4)]))
    story.append(t_sig)

    doc.build(story)


# =========================================================================
# 08: SPIT AICTE SANCTION RELEASE ORDER (RO-AICTE-2026-SPIT-0089)
# =========================================================================
def build_pdf_08(filepath):
    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []

    story.append(Paragraph("ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", gov_header_style))
    story.append(Paragraph("MINISTRY OF EDUCATION &bull; GOVERNMENT OF INDIA &bull; NEW DELHI", gov_sub_header_style))
    story.append(Paragraph("REGULATION BUREAU &bull; NELSON MANDELA MARG, VASANT KUNJ, NEW DELHI 110070", gov_sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4c1d95'), spaceAfter=12))

    story.append(Paragraph("STATUTORY SANCTION ORDER &bull; TRIPARTITE DEPOSIT RELEASE & REFUND", title_style))
    story.append(Paragraph("ORDER REFERENCE: <b>AICTE/REG/REL-ORD/2026/SPIT-0089</b> &bull; DATE: <b>20-OCT-2026</b>", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>Sanction Order No:</b>", body_style),
            Paragraph("<b>RO-AICTE-2026-SPIT-0089</b>", body_style),
            Paragraph("<b>Order Date:</b>", body_style),
            Paragraph("20-Oct-2026", body_style)
        ],
        [
            Paragraph("<b>Target FDR Reference:</b>", body_style),
            Paragraph("<b>FDR-AICTE-2026-9101</b>", body_style),
            Paragraph("<b>Certificate No:</b>", body_style),
            Paragraph("BOB-SPIT-2026-9101", body_style)
        ],
        [
            Paragraph("<b>Institution Name:</b>", body_style),
            Paragraph("<b>Sardar Patel Institute of Technology</b>", body_style),
            Paragraph("<b>Institution ID:</b>", body_style),
            Paragraph("INST-SPIT-MH-019", body_style)
        ],
        [
            Paragraph("<b>Release Deposit Sum:</b>", body_style),
            Paragraph("<b>INR 50,00,000.00</b> (Fifty Lakhs Only)", body_style),
            Paragraph("<b>Deposit Bank:</b>", body_style),
            Paragraph("Bank of Baroda (Andheri W)", body_style)
        ],
        [
            Paragraph("<b>Settlement Account:</b>", body_style),
            Paragraph("Bhavan's Educational Trust A/C 910100482910", body_style),
            Paragraph("<b>Compliance Status:</b>", body_style),
            Paragraph("<font color='#16a34a'><b>100% Fulfilled (Regulatory Norm)</b></font>", body_style)
        ]
    ]

    t = Table(table_data, colWidths=[130, 140, 120, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#faf5ff')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#d8b4fe')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    directive_box = [[
        Paragraph(
            "<b>EXECUTIVE CLEARANCE & LIEN DISCHARGE DIRECTIVE:</b><br/>"
            "The Competent Authority (AICTE Executive Committee), in exercise of powers vested under the AICTE Act 1987 and Approval Process Handbook regulations, "
            "hereby accords formal sanction for the <b>discharge of joint lien and release of security deposit</b> in respect of "
            "<b>Sardar Patel Institute of Technology (INST-SPIT-MH-019)</b>.<br/>"
            "The Branch Manager, Bank of Baroda (Andheri West Branch), is hereby instructed to discharge AICTE's lien and credit the principal deposit "
            "together with all accrued interest to the institution's verified trust account without delay.",
            order_clause_style
        )
    ]]
    t_dir = Table(directive_box, colWidths=[520])
    t_dir.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f3e8ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#7c3aed')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_dir)
    story.append(Spacer(1, 24))

    sig_data = [
        [
            Paragraph("<b>EXAMINED & RECOMMENDED BY:</b><br/><br/><br/>__________________________________<br/>Smt. Sunita Rao<br/>Senior Scrutiny Officer (Regulation Bureau)", body_style),
            Paragraph("<b>SANCTIONED & AUTHORIZED BY:</b><br/><br/><br/>__________________________________<br/>Dr. Ramesh Sharma<br/>Bureau Chief & Approving Authority &bull; AICTE", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('PADDING', (0,0), (-1,-1), 4)]))
    story.append(t_sig)

    doc.build(story)


# =========================================================================
# 09: DITE VALID FDR CERTIFICATE (Delhi - Clean ₹1.00 Cr, 5-Yr, PNB)
# =========================================================================
def build_pdf_09(filepath):
    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []

    story.append(Paragraph("PUNJAB NATIONAL BANK", bank_header_pnb))
    story.append(Paragraph("CONNAUGHT PLACE BRANCH &bull; NEW DELHI &bull; DELHI 110001", sub_header_style))
    story.append(Paragraph("IFSC CODE: <b>PUNB0000100</b> &bull; MICR: 110024001 &bull; PHONE: +91 11 2341 5500", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#990033'), spaceAfter=12))

    story.append(Paragraph("FIXED DEPOSIT RECEIPT &bull; STATUTORY SECURITY DEPOSIT", title_style))
    story.append(Paragraph("(Under AICTE Approval Process Handbook — Multi-Disciplinary Institutional Security)", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>Certificate Number:</b>", body_style),
            Paragraph("PNB-DITE-2026-7701", body_style),
            Paragraph("<b>Bureau Reference:</b>", body_style),
            Paragraph("<b>FDR-AICTE-2026-7701</b>", body_style)
        ],
        [
            Paragraph("<b>Depositor Institution:</b>", body_style),
            Paragraph("<b>Delhi Institute of Technical Education</b>", body_style),
            Paragraph("<b>AICTE PID / Code:</b>", body_style),
            Paragraph("<b>INST-DITE-DL-004</b> (1-3091823)", body_style)
        ],
        [
            Paragraph("<b>Campus Address:</b>", body_style),
            Paragraph("Institutional Area, Okhla Phase III, New Delhi 110020", body_style),
            Paragraph("<b>Discipline:</b>", body_style),
            Paragraph("Technical Campus & MCA / MBA", body_style)
        ],
        [
            Paragraph("<b>Deposit Amount (INR):</b>", body_style),
            Paragraph("<b>INR 1,00,00,000.00</b><br/>(Rupees One Crore Only)", body_style),
            Paragraph("<b>Interest Rate:</b>", body_style),
            Paragraph("7.40% p.a. (Quarterly Compounding)", body_style)
        ],
        [
            Paragraph("<b>Date of Issue:</b>", body_style),
            Paragraph("01-Jun-2026", body_style),
            Paragraph("<b>Date of Maturity:</b>", body_style),
            Paragraph("<b>01-Jun-2031</b> (Full 5-Year Mandatory Lock-in)", body_style)
        ],
        [
            Paragraph("<b>Joint Lien Holder:</b>", body_style),
            Paragraph("The Member Secretary, AICTE New Delhi", body_style),
            Paragraph("<b>Branch Code:</b>", body_style),
            Paragraph("00001 (Connaught Place)", body_style)
        ]
    ]

    t = Table(table_data, colWidths=[130, 140, 120, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fdf2f8')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fbcfe8')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    lien_box = [[
        Paragraph(
            "<b>STATUTORY TRIPARTITE LIEN UNDERTAKING (AICTE APH DIRECTIVE):</b><br/>"
            "This ₹1.00 Crore security deposit is established by <b>Delhi Institute of Technical Education (INST-DITE-DL-004)</b> "
            "pledged under joint lien to <b>The Member Secretary, AICTE New Delhi</b>. Punjab National Bank certifies that no early encashment "
            "or collateral assignment shall be permitted prior to maturity date 01-Jun-2031 without official release sanction from AICTE.",
            lien_clause_style
        )
    ]]
    t_lien = Table(lien_box, colWidths=[520])
    t_lien.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#3b82f6')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_lien)
    story.append(Spacer(1, 24))

    sig_data = [
        [
            Paragraph("<b>For DELHI INST. OF TECH. EDUCATION</b><br/><br/><br/>__________________________________<br/>Director / Authorized Trustee<br/>Okhla Phase III &bull; New Delhi", body_style),
            Paragraph("<b>For PUNJAB NATIONAL BANK</b><br/><br/><br/>__________________________________<br/>Assistant General Manager<br/>CP Branch &bull; IFSC: PUNB0000100", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('PADDING', (0,0), (-1,-1), 4)]))
    story.append(t_sig)

    doc.build(story)


# =========================================================================
# 10: DITE DISCREPANCY DEFICIT FDR (₹30L Deficit, 18-Month Tenure)
# =========================================================================
def build_pdf_10(filepath):
    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []

    story.append(Paragraph("PUNJAB NATIONAL BANK", bank_header_pnb))
    story.append(Paragraph("CONNAUGHT PLACE BRANCH &bull; NEW DELHI &bull; DELHI 110001", sub_header_style))
    story.append(Paragraph("IFSC CODE: <b>PUNB0000100</b>", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#c53030'), spaceAfter=12))

    story.append(Paragraph("FIXED DEPOSIT RECEIPT &bull; [STATUTORY DISCREPANCY TEST INSTRUMENT]", title_disc_style))
    story.append(Paragraph("TEST SCENARIO: ₹30 Lakhs Deficit Shortfall & 18-Month Tenure Variance", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>Certificate Number:</b>", body_style),
            Paragraph("PNB-DITE-2026-DISC03", body_style),
            Paragraph("<b>Bureau Reference:</b>", body_style),
            Paragraph("<b>FDR-AICTE-2026-DISC03</b>", body_style)
        ],
        [
            Paragraph("<b>Depositor Institution:</b>", body_style),
            Paragraph("<b>Delhi Institute of Technical Education</b>", body_style),
            Paragraph("<b>AICTE PID / Code:</b>", body_style),
            Paragraph("<b>INST-DITE-DL-004</b> (1-3091823)", body_style)
        ],
        [
            Paragraph("<b>Campus Address:</b>", body_style),
            Paragraph("Institutional Area, Okhla Phase III, New Delhi 110020", body_style),
            Paragraph("<b>Discipline:</b>", body_style),
            Paragraph("Technical Campus", body_style)
        ],
        [
            Paragraph("<b>Deposit Amount (INR):</b>", body_style),
            Paragraph("<font color='#c53030'><b>INR 70,00,000.00</b></font><br/>(Variance: Deficit of ₹30 Lakhs vs ₹1 Cr norm)", body_style),
            Paragraph("<b>Interest Rate:</b>", body_style),
            Paragraph("7.00% p.a.", body_style)
        ],
        [
            Paragraph("<b>Date of Issue:</b>", body_style),
            Paragraph("01-Jun-2026", body_style),
            Paragraph("<b>Date of Maturity:</b>", body_style),
            Paragraph("<font color='#c53030'><b>01-Dec-2027</b></font><br/>(Variance: 18-Month Tenure vs 5-Year Norm)", body_style)
        ],
        [
            Paragraph("<b>Joint Lien Holder:</b>", body_style),
            Paragraph("The Member Secretary, AICTE New Delhi", body_style),
            Paragraph("<b>Branch Code:</b>", body_style),
            Paragraph("00001", body_style)
        ]
    ]

    t = Table(table_data, colWidths=[130, 140, 120, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fff5f5')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fca5a5')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    warn_box = [[
        Paragraph(
            "<b>AICTE SENTRY ENGINE ALERT &bull; DISCREPANCY PROFILE:</b><br/>"
            "This instrument presents two statutory compliance variances for Delhi Institute of Technical Education:<br/>"
            "1. <b>Tenure Shortfall:</b> Maturity date 01-Dec-2027 represents only 18 months, failing the statutory 5-year lock-in requirement.<br/>"
            "2. <b>Amount Shortfall:</b> Created for ₹70,00,000 against mandatory ₹1,00,00,000 establishment norm for technical campus.<br/>"
            "The AICTE OCR Sentry will flag this discrepancy and alert the Scrutiny Officer.",
            warning_style
        )
    ]]
    t_warn = Table(warn_box, colWidths=[520])
    t_warn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fee2e2')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#ef4444')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_warn)
    story.append(Spacer(1, 24))

    sig_data = [
        [
            Paragraph("<b>DELHI INST. OF TECH. EDUCATION</b><br/><br/><br/>__________________________________<br/>Authorized Signatory & Seal", body_style),
            Paragraph("<b>PUNJAB NATIONAL BANK</b><br/><br/><br/>__________________________________<br/>Branch Head & Seal &bull; PUNB0000100", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('PADDING', (0,0), (-1,-1), 4)]))
    story.append(t_sig)

    doc.build(story)


# =========================================================================
# 11: VIT FRESH VALID FDR (Clean ₹50L, 5-Yr, SBI Wadala, Fresh Ref 9901)
# =========================================================================
def build_pdf_11(filepath):
    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []

    story.append(Paragraph("STATE BANK OF INDIA", bank_header_sbi))
    story.append(Paragraph("WADALA EAST BRANCH &bull; MUMBAI &bull; MAHARASHTRA 400037", sub_header_style))
    story.append(Paragraph("IFSC CODE: <b>SBIN0001823</b> &bull; MICR: 400002018", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#003366'), spaceAfter=12))

    story.append(Paragraph("FIXED DEPOSIT RECEIPT &bull; STATUTORY REGULATORY SECURITY DEPOSIT", title_style))
    story.append(Paragraph("(Fresh Cycle 2026-2031 &bull; AICTE Tripartite Joint Lien Depository)", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>Certificate Number:</b>", body_style),
            Paragraph("SBI-VIT-2026-9901", body_style),
            Paragraph("<b>Bureau Reference:</b>", body_style),
            Paragraph("<b>FDR-AICTE-2026-9901</b>", body_style)
        ],
        [
            Paragraph("<b>Depositor Institution:</b>", body_style),
            Paragraph("<b>Vidyalankar Institute of Technology</b>", body_style),
            Paragraph("<b>AICTE PID / Code:</b>", body_style),
            Paragraph("<b>INST-VIT-MH-077</b> (1-20938472)", body_style)
        ],
        [
            Paragraph("<b>Campus Address:</b>", body_style),
            Paragraph("Vidyalankar Educational Campus, Wadala East, Mumbai 400037", body_style),
            Paragraph("<b>Discipline:</b>", body_style),
            Paragraph("Engineering & Technology (UG/PG)", body_style)
        ],
        [
            Paragraph("<b>Deposit Amount (INR):</b>", body_style),
            Paragraph("<b>INR 50,00,000.00</b><br/>(Rupees Fifty Lakhs Only)", body_style),
            Paragraph("<b>Interest Rate:</b>", body_style),
            Paragraph("7.25% p.a. (Quarterly Compounding)", body_style)
        ],
        [
            Paragraph("<b>Date of Issue:</b>", body_style),
            Paragraph("01-Jul-2026", body_style),
            Paragraph("<b>Date of Maturity:</b>", body_style),
            Paragraph("<b>01-Jul-2031</b> (Full 5-Year Lock-in)", body_style)
        ],
        [
            Paragraph("<b>Joint Lien Holder:</b>", body_style),
            Paragraph("The Member Secretary, AICTE New Delhi", body_style),
            Paragraph("<b>Branch Code:</b>", body_style),
            Paragraph("01823 (Wadala E)", body_style)
        ]
    ]

    t = Table(table_data, colWidths=[130, 140, 120, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    lien_box = [[
        Paragraph(
            "<b>MANDATORY STATUTORY JOINT LIEN DECLARATION:</b><br/>"
            "This Fixed Deposit has been established and pledged by <b>Vidyalankar Institute of Technology (INST-VIT-MH-077)</b> "
            "in accordance with AICTE Regulations. State Bank of India covenants that no premature withdrawal or lien discharge "
            "shall be executed without prior written authorization from The Member Secretary, AICTE New Delhi.",
            lien_clause_style
        )
    ]]
    t_lien = Table(lien_box, colWidths=[520])
    t_lien.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#3b82f6')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_lien)
    story.append(Spacer(1, 24))

    sig_data = [
        [
            Paragraph("<b>VIDYALANKAR INST. OF TECHNOLOGY</b><br/><br/><br/>__________________________________<br/>Principal &bull; Wadala (E), Mumbai", body_style),
            Paragraph("<b>STATE BANK OF INDIA</b><br/><br/><br/>__________________________________<br/>Branch Manager &bull; Wadala East", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('PADDING', (0,0), (-1,-1), 4)]))
    story.append(t_sig)

    doc.build(story)


# =========================================================================
# 12: VIT FRESH SANCTION ORDER (RO-AICTE-2026-VIT-0099)
# =========================================================================
def build_pdf_12(filepath):
    doc = SimpleDocTemplate(filepath, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []

    story.append(Paragraph("ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", gov_header_style))
    story.append(Paragraph("MINISTRY OF EDUCATION &bull; GOVERNMENT OF INDIA &bull; NEW DELHI", gov_sub_header_style))
    story.append(Paragraph("REGULATION BUREAU &bull; NELSON MANDELA MARG, VASANT KUNJ, NEW DELHI 110070", gov_sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4c1d95'), spaceAfter=12))

    story.append(Paragraph("STATUTORY SANCTION ORDER &bull; TRIPARTITE DEPOSIT RELEASE & REFUND", title_style))
    story.append(Paragraph("ORDER REFERENCE: <b>AICTE/REG/REL-ORD/2026/VIT-0099</b> &bull; DATE: <b>30-OCT-2026</b>", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>Sanction Order No:</b>", body_style),
            Paragraph("<b>RO-AICTE-2026-VIT-0099</b>", body_style),
            Paragraph("<b>Order Date:</b>", body_style),
            Paragraph("30-Oct-2026", body_style)
        ],
        [
            Paragraph("<b>Target FDR Reference:</b>", body_style),
            Paragraph("<b>FDR-AICTE-2026-9901</b>", body_style),
            Paragraph("<b>Certificate No:</b>", body_style),
            Paragraph("SBI-VIT-2026-9901", body_style)
        ],
        [
            Paragraph("<b>Institution Name:</b>", body_style),
            Paragraph("<b>Vidyalankar Institute of Technology</b>", body_style),
            Paragraph("<b>Institution ID:</b>", body_style),
            Paragraph("INST-VIT-MH-077", body_style)
        ],
        [
            Paragraph("<b>Release Deposit Sum:</b>", body_style),
            Paragraph("<b>INR 50,00,000.00</b> (Fifty Lakhs Only)", body_style),
            Paragraph("<b>Deposit Bank:</b>", body_style),
            Paragraph("State Bank of India (Wadala E)", body_style)
        ],
        [
            Paragraph("<b>Settlement Account:</b>", body_style),
            Paragraph("VIT Educational Trust A/C 8831092001", body_style),
            Paragraph("<b>Compliance Status:</b>", body_style),
            Paragraph("<font color='#16a34a'><b>100% Fulfilled (8-Year Regulatory Norm)</b></font>", body_style)
        ]
    ]

    t = Table(table_data, colWidths=[130, 140, 120, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#faf5ff')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#d8b4fe')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    directive_box = [[
        Paragraph(
            "<b>EXECUTIVE CLEARANCE & LIEN DISCHARGE DIRECTIVE:</b><br/>"
            "The Competent Authority (AICTE Executive Committee), in exercise of powers vested under the AICTE Act 1987 and Approval Process Handbook regulations, "
            "hereby accords formal sanction for the <b>discharge of joint lien and release of security deposit</b> in respect of "
            "<b>Vidyalankar Institute of Technology (INST-VIT-MH-077)</b>.<br/>"
            "The Branch Manager, State Bank of India (Wadala East Branch), is hereby instructed to discharge AICTE's lien and credit the principal deposit "
            "together with all accrued interest to the institution's verified trust account without delay.",
            order_clause_style
        )
    ]]
    t_dir = Table(directive_box, colWidths=[520])
    t_dir.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f3e8ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#7c3aed')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_dir)
    story.append(Spacer(1, 24))

    sig_data = [
        [
            Paragraph("<b>EXAMINED & RECOMMENDED BY:</b><br/><br/><br/>__________________________________<br/>Smt. Sunita Rao<br/>Senior Scrutiny Officer (Regulation Bureau)", body_style),
            Paragraph("<b>SANCTIONED & AUTHORIZED BY:</b><br/><br/><br/>__________________________________<br/>Dr. Ramesh Sharma<br/>Bureau Chief & Approving Authority &bull; AICTE", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('PADDING', (0,0), (-1,-1), 4)]))
    story.append(t_sig)

    doc.build(story)


# =========================================================================
# MAIN GENERATION & MIRRORING ROUTINE
# =========================================================================
def main():
    generators = [
        ("05_SPIT_VALID_FDR_CERTIFICATE.pdf", build_pdf_05),
        ("06_SPIT_DISCREPANCY_DEFICIT_FDR.pdf", build_pdf_06),
        ("07_SPIT_BANK_CBS_CONFIRMATION_FEED.pdf", build_pdf_07),
        ("08_SPIT_AICTE_SANCTION_RELEASE_ORDER.pdf", build_pdf_08),
        ("09_DITE_VALID_FDR_CERTIFICATE.pdf", build_pdf_09),
        ("10_DITE_DISCREPANCY_DEFICIT_FDR.pdf", build_pdf_10),
        ("11_VIT_FRESH_VALID_FDR.pdf", build_pdf_11),
        ("12_VIT_FRESH_SANCTION_ORDER.pdf", build_pdf_12)
    ]

    print("Generating fresh demonstration PDF suite...")
    for filename, builder in generators:
        sample_path = os.path.join(SAMPLE_DIR, filename)
        public_path = os.path.join(PUBLIC_DIR, filename)
        
        builder(sample_path)
        shutil.copyfile(sample_path, public_path)
        print(f"  [OK] Generated & mirrored: {filename}")

    print("\nAll 8 fresh demonstration PDFs successfully generated in:")
    print(f"  - {os.path.abspath(SAMPLE_DIR)}")
    print(f"  - {os.path.abspath(PUBLIC_DIR)}")

if __name__ == '__main__':
    main()

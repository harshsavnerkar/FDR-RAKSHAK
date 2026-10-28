import os
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

def build_pdf_1_valid_vit_fdr(filepath):
    """PDF 1: Valid Institutional FDR Certificate for Vidyalankar Institute of Technology"""
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()

    bank_header_style = ParagraphStyle(
        'BankHeader',
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
        fontSize=13,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#990000')
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

    story = []

    # Bank Top Header
    story.append(Paragraph("STATE BANK OF INDIA", bank_header_style))
    story.append(Paragraph("WADALA EAST BRANCH &bull; MUMBAI &bull; MAHARASHTRA 400037", sub_header_style))
    story.append(Paragraph("IFSC CODE: <b>SBIN0001823</b> &bull; MICR: 400002018 &bull; PHONE: +91 22 2416 1126", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#003366'), spaceAfter=12))

    story.append(Paragraph("FIXED DEPOSIT RECEIPT &bull; STATUTORY REGULATORY SECURITY DEPOSIT", title_style))
    story.append(Paragraph("(Under AICTE Approval Process Handbook — Pledged Security Instrument)", sub_header_style))
    story.append(Spacer(1, 14))

    # Details Table
    table_data = [
        [
            Paragraph("<b>Certificate Number:</b>", body_style),
            Paragraph("SBI-VIT-2026-883101", body_style),
            Paragraph("<b>Bureau Reference:</b>", body_style),
            Paragraph("<b>FDR-AICTE-2026-8831</b>", body_style)
        ],
        [
            Paragraph("<b>Depositor Institution:</b>", body_style),
            Paragraph("<b>Vidyalankar Institute of Technology</b>", body_style),
            Paragraph("<b>AICTE PID / Code:</b>", body_style),
            Paragraph("<b>INST-VIT-MH-077</b> (1-20938472)", body_style)
        ],
        [
            Paragraph("<b>Campus Address:</b>", body_style),
            Paragraph("Vidyalankar Educational Campus, Vidyalankar College Marg, Wadala East, Mumbai 400037", body_style),
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
            Paragraph("01-Apr-2026", body_style),
            Paragraph("<b>Date of Maturity:</b>", body_style),
            Paragraph("<b>01-Apr-2031</b> (Full 5-Year Tenure)", body_style)
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

    # Statutory Lien Box
    lien_box_data = [
        [
            Paragraph(
                "<b>MANDATORY STATUTORY JOINT LIEN DECLARATION:</b><br/>"
                "This Fixed Deposit has been established and pledged by <b>Vidyalankar Institute of Technology (INST-VIT-MH-077)</b> "
                "strictly in accordance with AICTE Regulations and Approval Process Handbook directives. "
                "The State Bank of India covenants and confirms that <b>no premature withdrawal, encashment, loan, or lien discharge "
                "shall be executed</b> against this receipt without prior written tripartite authorization from The Member Secretary, "
                "AICTE New Delhi. Upon maturity on 01-Apr-2031, the instrument shall be renewed or released solely as per explicit AICTE orders.",
                lien_clause_style
            )
        ]
    ]
    t_lien = Table(lien_box_data, colWidths=[520])
    t_lien.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#3b82f6')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_lien)
    story.append(Spacer(1, 22))

    # Signature Block
    sig_data = [
        [
            Paragraph("<b>For VIDYALANKAR INST. OF TECHNOLOGY</b><br/><br/><br/>__________________________________<br/>Dr. S. K. Deshmukh &bull; Principal<br/>Vidyalankar Campus &bull; Wadala (E), Mumbai", body_style),
            Paragraph("<b>For STATE BANK OF INDIA</b><br/><br/><br/>__________________________________<br/>Branch Manager / Chief Manager<br/>Wadala Branch &bull; IFSC: SBIN0001823", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sig)

    doc.build(story)


def build_pdf_2_discrepancy_vit_fdr(filepath):
    """PDF 2: Discrepancy FDR Certificate for Vidyalankar Institute of Technology (Variance Test)"""
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()

    bank_header_style = ParagraphStyle(
        'BankHeader2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#990000')
    )
    sub_header_style = ParagraphStyle(
        'SubHeader2',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#333333')
    )
    title_style = ParagraphStyle(
        'CertTitle2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#c53030')
    )
    body_style = ParagraphStyle(
        'Body2',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#1a1a1a')
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

    story = []

    story.append(Paragraph("STATE BANK OF INDIA", bank_header_style))
    story.append(Paragraph("WADALA EAST BRANCH &bull; MUMBAI &bull; MAHARASHTRA 400037", sub_header_style))
    story.append(Paragraph("IFSC CODE: <b>SBIN0001823</b> &bull; MICR: 400002018", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#c53030'), spaceAfter=12))

    story.append(Paragraph("FIXED DEPOSIT RECEIPT &bull; [STATUTORY DISCREPANCY TEST INSTRUMENT]", title_style))
    story.append(Paragraph("TEST SCENARIO: 1-Year Premature Maturity & Deposit Amount Variance", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>Certificate Number:</b>", body_style),
            Paragraph("SBI-VIT-2026-DISC01", body_style),
            Paragraph("<b>Bureau Reference:</b>", body_style),
            Paragraph("<b>FDR-AICTE-2026-DISC01</b>", body_style)
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
            Paragraph("Engineering & Technology", body_style)
        ],
        [
            Paragraph("<b>Deposit Amount (INR):</b>", body_style),
            Paragraph("<font color='#c53030'><b>INR 35,00,000.00</b></font><br/>(Variance: Deficit of ₹15 Lakhs against ₹50L norm)", body_style),
            Paragraph("<b>Interest Rate:</b>", body_style),
            Paragraph("6.85% p.a.", body_style)
        ],
        [
            Paragraph("<b>Date of Issue:</b>", body_style),
            Paragraph("01-Apr-2026", body_style),
            Paragraph("<b>Date of Maturity:</b>", body_style),
            Paragraph("<font color='#c53030'><b>01-Apr-2027</b></font><br/>(Variance: 1-Year Premature vs 5-Yr Norm)", body_style)
        ],
        [
            Paragraph("<b>Joint Lien Holder:</b>", body_style),
            Paragraph("The Member Secretary, AICTE New Delhi", body_style),
            Paragraph("<b>Branch Code:</b>", body_style),
            Paragraph("01823", body_style)
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

    warn_box_data = [
        [
            Paragraph(
                "<b>AICTE ANOMALY DETECTION TEST NOTICE:</b><br/>"
                "This document is intentionally drafted with two non-compliant statutory variances for <b>Vidyalankar Institute of Technology</b>:<br/>"
                "1. <b>Maturity Date Variance:</b> Instrument matures on 01-Apr-2027 (Tenure 12 Months). AICTE Handbooks strictly require a 5-year lock-in (01-Apr-2031).<br/>"
                "2. <b>Amount Variance:</b> Created for ₹35,00,000 against mandatory ₹50,00,000 security deposit requirement (Deficit: ₹15,00,000).<br/>"
                "FDR Rakshak's OCR intake engine should automatically detect both variances and flag status as <b>DISCREPANCY</b>.",
                warning_style
            )
        ]
    ]
    t_warn = Table(warn_box_data, colWidths=[520])
    t_warn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fee2e2')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#ef4444')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_warn)
    story.append(Spacer(1, 22))

    sig_data = [
        [
            Paragraph("<b>VIDYALANKAR INST. OF TECHNOLOGY</b><br/><br/><br/>__________________________________<br/>Finance Officer / Authorized Trustee<br/>Institutional Seal &bull; Wadala (E)", body_style),
            Paragraph("<b>STATE BANK OF INDIA &bull; WADALA</b><br/><br/><br/>__________________________________<br/>Authorized Officer & Seal<br/>IFSC: SBIN0001823", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sig)

    doc.build(story)


def build_pdf_3_bank_vit_confirmation(filepath):
    """PDF 3: Bank Direct Confirmation Certificate for Vidyalankar Institute of Technology"""
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()

    header_style = ParagraphStyle(
        'BankHeader3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0f766e')
    )
    sub_header_style = ParagraphStyle(
        'SubHeader3',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#333333')
    )
    title_style = ParagraphStyle(
        'CertTitle3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0f766e')
    )
    body_style = ParagraphStyle(
        'Body3',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#1a1a1a')
    )
    cbs_box_style = ParagraphStyle(
        'CbsClause',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor('#065f46')
    )

    story = []

    story.append(Paragraph("STATE BANK OF INDIA", header_style))
    story.append(Paragraph("INSTITUTIONAL BANKING & GOVT. BUSINESS NODAL HUB", sub_header_style))
    story.append(Paragraph("STATE BANK BHAVAN, NARIMAN POINT, MUMBAI 400021 &bull; EMAIL: treasury.nodal@sbi.co.in", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f766e'), spaceAfter=12))

    story.append(Paragraph("OFFICIAL BANK CONFIRMATION FEED &bull; LIEN VERIFICATION CERTIFICATE", title_style))
    story.append(Paragraph("Transmitted directly via Core Banking Solution (CBS) to AICTE Regulation Bureau", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>CBS Confirmation Reference:</b>", body_style),
            Paragraph("<b>CBS-SBI-VIT-2026-8831</b>", body_style),
            Paragraph("<b>Confirmation Date:</b>", body_style),
            Paragraph("28-Oct-2026 14:45:10 IST", body_style)
        ],
        [
            Paragraph("<b>Target Deposit Reference:</b>", body_style),
            Paragraph("FDR-AICTE-2026-8831", body_style),
            Paragraph("<b>Account Number:</b>", body_style),
            Paragraph("SBI-A/C-391084728831", body_style)
        ],
        [
            Paragraph("<b>Beneficiary Institution:</b>", body_style),
            Paragraph("<b>Vidyalankar Institute of Technology</b>", body_style),
            Paragraph("<b>Institution Code:</b>", body_style),
            Paragraph("<b>INST-VIT-MH-077</b>", body_style)
        ],
        [
            Paragraph("<b>Confirmed Principal Balance:</b>", body_style),
            Paragraph("<b>INR 50,00,000.00 (Fifty Lakhs Only)</b>", body_style),
            Paragraph("<b>CBS Status:</b>", body_style),
            Paragraph("<font color='#0f766e'><b>ACTIVE & MARKED IN CBS</b></font>", body_style)
        ],
        [
            Paragraph("<b>Confirmed Maturity Date:</b>", body_style),
            Paragraph("01-Apr-2031", body_style),
            Paragraph("<b>Interest Accrued:</b>", body_style),
            Paragraph("INR 1,84,200.00 (Reinvested)", body_style)
        ]
    ]

    t = Table(table_data, colWidths=[135, 135, 120, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdfa')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#99f6e4')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    cbs_box_data = [
        [
            Paragraph(
                "<b>INDEPENDENT BANK VERIFICATION ENDORSEMENT:</b><br/>"
                "This confirmation certificate is transmitted directly from State Bank of India's Core Banking System (CBS) to "
                "the AICTE FDR Rakshak Central Depository for <b>Vidyalankar Institute of Technology (INST-VIT-MH-077)</b>. "
                "The Bank certifies and guarantees that:<br/>"
                "1. The deposit instrument is in live active custody and has not been encashed, liquidated, or assigned.<br/>"
                "2. System lock flag <b>'LIEN_AICTE_DELHI_RESTRICTED'</b> is actively engaged on Account 391084728831.<br/>"
                "3. Auto-renewal instructions are recorded in CBS to protect regulatory corpus upon tenure expiry.",
                cbs_box_style
            )
        ]
    ]
    t_cbs = Table(cbs_box_data, colWidths=[520])
    t_cbs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ecfdf5')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#10b981')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_cbs)
    story.append(Spacer(1, 22))

    sig_data = [
        [
            Paragraph("<b>VERIFIED BY CBS AUTOMATION NODE</b><br/><br/><br/>Digital Signature Hash: <code>c4f1...992b</code><br/>SBI Central Gateway Gateway Node 02", body_style),
            Paragraph("<b>SBI NODAL DESK CHIEF MANAGER</b><br/><br/><br/>__________________________________<br/>Shri R. K. Mahapatra &bull; Chief Manager<br/>SBI Treasury & Institutional Desk", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sig)

    doc.build(story)


def build_pdf_4_release_vit_sanction(filepath):
    """PDF 4: AICTE Tripartite Release & Refund Sanction Order for Vidyalankar Institute of Technology"""
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()

    header_style = ParagraphStyle(
        'GovHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=17,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#4c1d95')
    )
    sub_header_style = ParagraphStyle(
        'GovSubHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#333333')
    )
    title_style = ParagraphStyle(
        'OrderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#4c1d95')
    )
    body_style = ParagraphStyle(
        'Body4',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#1a1a1a')
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

    story = []

    story.append(Paragraph("ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", header_style))
    story.append(Paragraph("MINISTRY OF EDUCATION &bull; GOVERNMENT OF INDIA &bull; NEW DELHI", sub_header_style))
    story.append(Paragraph("REGULATION BUREAU &bull; NELSON MANDELA MARG, VASANT KUNJ, NEW DELHI 110070", sub_header_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4c1d95'), spaceAfter=12))

    story.append(Paragraph("STATUTORY SANCTION ORDER &bull; TRIPARTITE DEPOSIT RELEASE & REFUND", title_style))
    story.append(Paragraph("ORDER REFERENCE: <b>AICTE/REG/REL-ORD/2026/VIT-0042</b> &bull; DATE: 28-OCT-2026", sub_header_style))
    story.append(Spacer(1, 14))

    table_data = [
        [
            Paragraph("<b>Sanction Order No:</b>", body_style),
            Paragraph("<b>RO-AICTE-2026-VIT-0042</b>", body_style),
            Paragraph("<b>Order Date:</b>", body_style),
            Paragraph("28-Oct-2026", body_style)
        ],
        [
            Paragraph("<b>Target FDR Reference:</b>", body_style),
            Paragraph("FDR-AICTE-2024-8831", body_style),
            Paragraph("<b>Certificate No:</b>", body_style),
            Paragraph("SBI-VIT-2024-8831", body_style)
        ],
        [
            Paragraph("<b>Institution Name:</b>", body_style),
            Paragraph("<b>Vidyalankar Institute of Technology</b>", body_style),
            Paragraph("<b>Institution ID:</b>", body_style),
            Paragraph("<b>INST-VIT-MH-077</b>", body_style)
        ],
        [
            Paragraph("<b>Release Deposit Sum:</b>", body_style),
            Paragraph("<b>INR 35,00,000.00</b> (Thirty-Five Lakhs Only)", body_style),
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

    sanction_box_data = [
        [
            Paragraph(
                "<b>EXECUTIVE CLEARANCE & LIEN DISCHARGE DIRECTIVE:</b><br/>"
                "The Competent Authority (AICTE Executive Committee), in exercise of powers vested under the AICTE Act 1987 and "
                "Approval Process Handbook regulations, hereby accords formal sanction for the <b>discharge of joint lien and release "
                "of security deposit</b> in respect of <b>Vidyalankar Institute of Technology (INST-VIT-MH-077)</b>, "
                "located at Vidyalankar Educational Campus, Vidyalankar College Marg, Wadala East, Mumbai 400037.<br/>"
                "The Branch Manager, State Bank of India (Wadala Branch), is hereby instructed to discharge AICTE's lien and credit the principal deposit "
                "together with all accrued interest to the institution's verified trust account without delay.",
                order_clause_style
            )
        ]
    ]
    t_sanction = Table(sanction_box_data, colWidths=[520])
    t_sanction.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f3e8ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#a855f7')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_sanction)
    story.append(Spacer(1, 22))

    sig_data = [
        [
            Paragraph("<b>EXAMINED & RECOMMENDED BY:</b><br/><br/><br/>__________________________________<br/>Smt. Sunita Rao<br/>Senior Scrutiny Officer (Regulation Bureau)", body_style),
            Paragraph("<b>SANCTIONED & AUTHORIZED BY:</b><br/><br/><br/>__________________________________<br/>Dr. Ramesh Sharma<br/>Bureau Chief & Approving Authority &bull; AICTE", body_style)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[260, 260])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sig)

    doc.build(story)

if __name__ == '__main__':
    target_dir = 'sample_test_documents'
    public_dir = 'public/test_pdfs'
    artifact_dir = r'C:\Users\Harsh\.gemini\antigravity\brain\5e767bce-79f2-475d-85a3-863b1d3aa387\test_pdfs'

    os.makedirs(target_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(artifact_dir, exist_ok=True)

    files = [
        ('01_INSTITUTE_VALID_FDR_CERTIFICATE.pdf', build_pdf_1_valid_vit_fdr),
        ('02_INSTITUTE_DISCREPANCY_FDR_CERTIFICATE.pdf', build_pdf_2_discrepancy_vit_fdr),
        ('03_BANK_CBS_LIEN_CONFIRMATION_FEED.pdf', build_pdf_3_bank_vit_confirmation),
        ('04_AICTE_BUREAU_RELEASE_SANCTION_ORDER.pdf', build_pdf_4_release_sanction_vit if 'build_pdf_4_release_sanction_vit' in locals() else build_pdf_4_release_vit_sanction)
    ]

    for filename, builder in files:
        target_path = os.path.join(target_dir, filename)
        builder(target_path)
        shutil.copyfile(target_path, os.path.join(public_dir, filename))
        shutil.copyfile(target_path, os.path.join(artifact_dir, filename))
        print(f"Generated for Vidyalankar: {filename}")

    print("All 4 Vidyalankar test PDFs generated and deployed successfully!")

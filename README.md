# FDR Rakshak — Security Deposit & FDR Management Portal

**AICTE Regulation Bureau, Ministry of Education, Government of India**  
*Step 1: Frontend UI Foundation & Industrial Skeuomorphism Design System*

---

## Overview

**FDR Rakshak** is an administrative regulatory dashboard built specifically for the AICTE Regulation Bureau to manage institutional Fixed Deposit Receipts (FDRs), verification queues, maturity milestones, renewals, and discharge release requests.

In accordance with **Step 1: UI Foundation**, this phase focuses strictly on the visual architecture, administrative usability, responsive layout, and interaction physics. No backend, live database, OCR neural engine, or authentication has been connected yet; all displayed records and telemetry are mock data derived dynamically.

---

## Design System: Industrial Skeuomorphism

The application strictly implements the **Industrial Skeuomorphism** design specification:

- **Color Tokens**:
  - `chassis`: `#e0e5ec`
  - `panel`: `#f0f2f5`
  - `recessed`: `#d1d9e6`
  - `text-primary`: `#2d3436`
  - `text-muted`: `#4a5568`
  - `accent`: `#ff4757` (Critical alerts & unrenewed overdue cases)
  - `accent-orange`: `#ff6b35` (AICTE industrial action accent)
  - `shadow`: `#babecc`
  - `highlight`: `#ffffff`
  - `deep-shadow`: `#a3b1c6`
- **Typography**:
  - **Inter**: General UI copy, headings, and labels.
  - **JetBrains Mono**: Numerical values, dates, technical IDs, status metadata, and form inputs.
- **Lighting & Physics**:
  - Consistent top-left light source.
  - Layered tactile panels with dual neumorphic shadows.
  - Recessed input wells and elevated interactive cards.
  - Embossed screw-head hardware rivets, ventilation slots, and illuminated LED status indicators (green, amber, red, blue).
  - Pressed/active state button translation with inset bevels.

---

## Core Components Built

| Component | Path | Description |
|---|---|---|
| **`Sidebar.jsx`** | `src/components/Sidebar.jsx` | Left sidebar with shield badge, 9 navigation items, desktop rail collapse, mobile drawer, and status LED. |
| **`Header.jsx`** | `src/components/Header.jsx` | Breadcrumbs, current title, recessed search input, notification flyout with badge, and AICTE Administrator profile menu. |
| **`StatCard.jsx`** | `src/components/StatCard.jsx` | Tactile hardware cards with corner screws, recessed icon wells, monospace metrics, and click-to-filter capability. |
| **`FDRTable.jsx`** | `src/components/FDRTable.jsx` | Priority cases table with status filters (All, Verified, Pending, Discrepancy, Expiring Soon), priority filter, local search, sorting, and view dossier action. |
| **`RecordDetailsModal.jsx`** | `src/components/RecordDetailsModal.jsx` | Official AICTE FDR dossier modal with bank details, lien status, physical custody location, OCR score, and action buttons. |
| **`DashboardCharts.jsx`** | `src/components/DashboardCharts.jsx` | Recharts donut chart for status distribution & bar chart for upcoming maturity schedule with custom skeuomorphic tooltips. |
| **`RecentActivity.jsx`** | `src/components/RecentActivity.jsx` | Live administrative audit trail feed with event LEDs. |
| **`QuickActions.jsx`** | `src/components/QuickActions.jsx` | Fast command buttons for Register Institution, Upload FDR, Review Queue, and Release Requests. |
| **`ActionModal.jsx`** | `src/components/ActionModal.jsx` | Interactive modal simulating intake workflows and queue processing. |
| **`PlaceholderView.jsx`** | `src/components/PlaceholderView.jsx` | Contextual administrative placeholder screens for secondary navigation views. |
| **`StatusBadge.jsx`** | `src/components/StatusBadge.jsx` | Recessed pills with illuminated LEDs (Verified, Pending, Discrepancy, Expiring Soon). |

---

## How to Run the Application

```bash
# 1. Navigate to the project directory
cd c:\Users\Harsh\Downloads\FDR_Rakshak

# 2. Run the Vite development server
npm run dev

# 3. Open in your browser
http://localhost:3001
```

To build for production:
```bash
npm run build
npm run preview
```

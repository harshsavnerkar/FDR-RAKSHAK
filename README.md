# FDR SmartGuard — Fixed Deposit Receipt & Security Deposit Management Portal

**AICTE Regulation Bureau, Ministry of Education, Government of India**  
*Step 2: Institution Management & FDR Repository Complete*

---

## Overview

**FDR SmartGuard** is an administrative regulatory dashboard built specifically for the AICTE Regulation Bureau to manage institutional Fixed Deposit Receipts (FDRs), verification queues, maturity milestones, renewals, and discharge release requests.

In **Step 2**, two core functional modules were implemented:
1. **Institution Management (`src/components/InstitutionManagement.jsx`)**: Searchable, filterable institutional directory, PID registration modal with strict validation, detail/dossier modal with in-place profile editing, associated FDR listing, and safe deletion guards.
2. **FDR Repository (`src/components/FdrRepository.jsx`)**: Full repository table, multi-field search, status/institution/bank/maturity-date range filtering, column sorting, Add FDR modal with strict validation, Edit FDR modal preserving stable internal IDs, and integration with the shared FDR Dossier modal.
3. **Shared Reactive Data Layer (`src/data/sampleFdrData.js` & `src/App.jsx`)**: Single source of truth for institutions and FDR records. Derived statistics, summary cards, Recharts visualizations, and institution metrics update immediately when records are created or edited.

---

## Architectural & Design Consistency

- **Design System**: Strict Industrial Skeuomorphism & Industrial Light aesthetic.
- **Palette**: Chassis `#e0e5ec`, elevated panel `#f0f2f5`, recessed wells `#d1d9e6`, charcoal text `#2d3436`, slate muted text `#4a5568`, and industrial orange `#ff6b35`.
- **Typography**: Inter for general administrative UI and JetBrains Mono for monetary values, dates, and technical identifiers.
- **Hardware Accents**: Corner screw rivets, ventilation grilles, and illuminated status LEDs.

---

## How to Run the Application

```powershell
# 1. Navigate to the project directory
cd c:\Users\Harsh\Downloads\FDR_Rakshak

# 2. Run the development server
npm run dev

# 3. Open in your browser
http://localhost:3001
```

To build for production:
```powershell
npm run build
npm run preview
```

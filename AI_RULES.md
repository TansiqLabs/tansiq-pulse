# Tansiq Pulse - AI Architecture & Business Logic Rules

> **Version:** 1.0.0  
> **Author:** Principal AI Architect  
> **Date:** February 2026  
> **Purpose:** This document serves as the authoritative source for all business logic decisions made during the MVP development. Future AI instances MUST follow these rules.

---

## 🎯 Core Philosophy

1. **Offline-First:** All data operations are local. No network dependencies.
2. **Simplicity:** A hospital receptionist should be able to use this without training.
3. **Speed:** Every interaction must feel instant (<100ms perceived latency).
4. **Data Integrity:** Never lose patient or billing data. Use transactions.

---

## 📊 Dashboard KPIs (Decided Logic)

The dashboard displays these real-time metrics:

| KPI | Calculation | Refresh |
|-----|-------------|---------|
| **Today's Revenue** | SUM(invoices.totalAmount) WHERE paidAt = TODAY AND status = PAID | Real-time |
| **Today's Appointments** | COUNT(appointments) WHERE date = TODAY | Real-time |
| **Patients in Queue** | COUNT(appointments) WHERE date = TODAY AND status = WAITING | Real-time |
| **Total Patients** | COUNT(patients) | On load |
| **Active Doctors** | COUNT(doctors) WHERE isActive = true | On load |
| **Pending Invoices** | COUNT(invoices) WHERE status IN (PENDING, PARTIALLY_PAID) | Real-time |
| **Monthly Revenue** | SUM(invoices.totalAmount) WHERE paidAt = THIS_MONTH | Chart data |

---

## 🏥 Patient Flow (The Golden Path)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   REGISTRATION  │────▶│   APPOINTMENT   │────▶│  CONSULTATION   │────▶│    BILLING      │
│   (New Patient) │     │   (Schedule)    │     │   (Doctor)      │     │   (Invoice)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │                       │
        ▼                       ▼                       ▼                       ▼
   Patient record         Appointment with        Status: COMPLETED       Invoice generated
   created with           status: SCHEDULED       Diagnosis & notes       with line items
   unique MRN                                     recorded                
```

### Patient Registration Rules:
- **MRN (Medical Record Number):** Auto-generated as `TP-YYYYMMDD-XXXX` (e.g., TP-20260203-0001)
- **Required Fields:** firstName, lastName, phone, dateOfBirth, gender
- **Optional Fields:** email, address, bloodType, emergencyContact, emergencyPhone
- **Validation:** Phone must be unique per patient

### Appointment Flow:
1. **SCHEDULED** → Initial state when booked
2. **WAITING** → Patient has arrived, waiting for doctor
3. **IN_PROGRESS** → Doctor is seeing the patient
4. **COMPLETED** → Consultation finished
5. **CANCELLED** → Appointment was cancelled
6. **NO_SHOW** → Patient didn't arrive

---

## 💰 Billing Logic (Invented Rules)

### Invoice Structure:
```
Invoice
├── Patient Reference
├── Appointment Reference (optional - walk-in billing allowed)
├── Line Items[]
│   ├── Service (from catalog) OR Custom description
│   ├── Quantity
│   ├── Unit Price
│   └── Line Total
├── Subtotal (sum of line items)
├── Discount (percentage OR fixed amount)
├── Tax (calculated on subtotal - discount)
└── Grand Total
```

### Tax Calculation:
- **Default Tax Rate:** 5% (stored in Settings, editable)
- **Tax Applied:** On (Subtotal - Discount)
- **Formula:** `grandTotal = (subtotal - discountAmount) * (1 + taxRate)`

### Discount Rules:
- **Type:** PERCENTAGE or FIXED
- **Maximum Discount:** 50% (hardcoded safety limit)
- **Applied Before Tax:** Always

### Invoice Statuses:
| Status | Meaning | Transition Rules |
|--------|---------|------------------|
| DRAFT | Being created | → PENDING, CANCELLED |
| PENDING | Awaiting payment | → PAID, PARTIALLY_PAID, CANCELLED |
| PARTIALLY_PAID | Some amount received | → PAID, CANCELLED |
| PAID | Fully paid | Terminal state |
| CANCELLED | Voided | Terminal state |

### Invoice Number Format:
`INV-YYYYMM-XXXX` (e.g., INV-202602-0042)

---

## 👨‍⚕️ Doctor Management

### Specializations (Pre-defined):
- General Medicine
- Pediatrics
- Cardiology
- Orthopedics
- Dermatology
- ENT (Ear, Nose, Throat)
- Ophthalmology
- Gynecology
- Neurology
- Psychiatry
- Dental
- General Surgery

### Doctor Availability:
- Stored as JSON: `{ "monday": ["09:00-13:00", "14:00-18:00"], ... }`
- Consultation duration: 15 minutes (default, per doctor setting)

---

## 🗃️ Database Schema Decisions

### Primary Keys:
- All tables use auto-increment integers for simplicity
- UUIDs avoided for SQLite performance

### Soft Deletes:
- Patients, Doctors, Invoices use `deletedAt` timestamp (null = active)
- Never hard-delete medical records

### Timestamps:
- All tables have `createdAt` and `updatedAt`
- ISO 8601 format stored as TEXT in SQLite

### Indexes:
- Patient: phone, mrn
- Appointment: date, status
- Invoice: invoiceNumber, status, paidAt

---

## 🎨 UI/UX Standards

### Color Palette:
```css
--primary: #0F172A       /* Slate 900 - Headers, primary text */
--secondary: #3B82F6     /* Blue 500 - Actions, links */
--accent: #10B981        /* Emerald 500 - Success states */
--warning: #F59E0B       /* Amber 500 - Warnings */
--danger: #EF4444        /* Red 500 - Errors, deletions */
--background: #F8FAFC    /* Slate 50 - Page background */
--card: #FFFFFF          /* White - Card backgrounds */
--border: #E2E8F0        /* Slate 200 - Borders */
```

### Animation Durations:
- Micro-interactions: 150ms
- Page transitions: 300ms
- Modal open/close: 200ms
- Sidebar expand/collapse: 200ms

### Spacing System:
- Use Tailwind's default scale (4px base)
- Card padding: p-6 (24px)
- Section gaps: gap-6 (24px)
- Form field gaps: gap-4 (16px)

---

## 🔒 IPC Channel Naming Convention

All Electron IPC channels follow: `entity:action`

```typescript
// Patients
'patients:getAll'
'patients:getById'
'patients:create'
'patients:update'
'patients:delete'
'patients:search'

// Doctors
'doctors:getAll'
'doctors:getById'
'doctors:create'
'doctors:update'
'doctors:delete'

// Appointments
'appointments:getAll'
'appointments:getByDate'
'appointments:create'
'appointments:updateStatus'
'appointments:cancel'

// Invoices
'invoices:getAll'
'invoices:getById'
'invoices:create'
'invoices:addPayment'
'invoices:cancel'

// Dashboard
'dashboard:getStats'
'dashboard:getRevenueChart'

// Services (catalog)
'services:getAll'
'services:create'
'services:update'
'services:delete'

// Settings
'settings:get'
'settings:update'
```

---

## 📁 File Structure Convention

```
tansiq-pulse/
├── electron/           # Electron main process
│   ├── main.ts         # Window creation, app lifecycle
│   ├── preload.ts      # IPC bridge exposure
│   └── ipc/            # IPC handlers by domain
│       ├── patients.ts
│       ├── doctors.ts
│       ├── appointments.ts
│       ├── invoices.ts
│       └── dashboard.ts
├── src/                # React renderer
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Shadcn components
│   │   ├── layout/     # Layout components
│   │   └── forms/      # Form components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities
│   ├── store/          # State management (if needed)
│   └── types/          # TypeScript types
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── public/             # Static assets
```

---

## 🚀 Future Considerations (Not MVP)

These are explicitly OUT OF SCOPE for MVP but documented for future:

1. **Multi-user Authentication** - Currently single-user
2. **Reporting/Export** - PDF invoices, patient history export
3. **Backup/Restore** - Database backup functionality
4. **Prescription Module** - Medicine prescriptions
5. **Inventory Management** - Medicine/supplies stock
6. **Lab Results** - Integration with lab systems
7. **Multi-branch** - Multiple hospital locations

---

## ✅ Definition of Done (DoD)

A feature is complete when:

1. ✅ Data persists correctly in SQLite
2. ✅ UI reflects state changes immediately
3. ✅ Form validation shows clear error messages
4. ✅ Loading states are shown during operations
5. ✅ Animations are smooth (60fps)
6. ✅ Works offline (no network calls)
7. ✅ No TypeScript errors
8. ✅ No console errors in production

---

*This document is the source of truth. When in doubt, refer here.*

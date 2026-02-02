# Tansiq Pulse

> 🏥 Offline Hospital Management System for Windows & Linux

A production-ready MVP desktop application built with Electron, React, and SQLite for managing hospital operations offline.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey.svg)

## ✨ Features

### Core Modules
- **📊 Dashboard** - Real-time KPIs, revenue charts, today's appointments at a glance
- **👥 Patient Management** - Full CRUD with MRN auto-generation, search, and soft delete
- **📅 Appointment Scheduling** - Date-based navigation, status tracking, doctor assignment
- **💰 Billing & Invoicing** - Service selection, tax calculation, payment recording, discounts
- **👨‍⚕️ Doctor Management** - Staff profiles with specialization and availability
- **⚙️ Settings** - Hospital configuration, billing defaults, tax rates

### Technical Highlights
- 🔒 **100% Offline** - All data stored locally in SQLite
- 🎨 **Modern UI** - Apple-like aesthetics with Shadcn/UI components
- ✨ **Smooth Animations** - Framer Motion powered transitions
- 📦 **Cross-Platform** - Single codebase for Windows & Linux
- 🔄 **Auto Updates** - GitHub Releases integration

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Electron 29 |
| Frontend | React 18, Vite 5, TypeScript 5.3 |
| Styling | Tailwind CSS 3.4, Shadcn/UI |
| Animation | Framer Motion 11 |
| Database | SQLite, Prisma ORM 5.10 |
| Charts | Recharts 2.12 |
| Forms | React Hook Form, Zod |
| CI/CD | GitHub Actions |

## 📁 Project Structure

```
tansiq-pulse/
├── electron/               # Electron main process
│   ├── main.ts            # Main process with IPC handlers
│   └── preload.ts         # Context bridge API
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data seeder
├── src/
│   ├── components/
│   │   ├── layout/        # Sidebar, Layout
│   │   └── ui/            # Shadcn components
│   ├── pages/             # Route pages
│   ├── lib/               # Utilities
│   ├── types/             # TypeScript interfaces
│   ├── App.tsx            # Main router
│   └── main.tsx           # React entry
├── public/                # Static assets
├── .github/workflows/     # CI/CD pipeline
└── AI_RULES.md           # Business logic documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 9+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tansiq/tansiq-pulse.git
   cd tansiq-pulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

### Building for Production

```bash
# Build for current platform
npm run build

# The output will be in dist/ folder
```

## 📖 Business Logic

All business logic decisions are documented in [AI_RULES.md](AI_RULES.md), including:

- **MRN Format**: `TP-YYYYMMDD-XXXX`
- **Invoice Number**: `INV-YYYYMM-XXXX`
- **Tax Calculation**: Applied after discount (default 5%)
- **Appointment Flow**: SCHEDULED → WAITING → IN_PROGRESS → COMPLETED
- **Soft Deletes**: Patient, Doctor, Invoice records are soft-deleted

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |

## 📦 Releasing

Releases are automated via GitHub Actions. To create a new release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will:
1. Build the app for Windows (.exe) and Linux (.AppImage, .deb)
2. Create a GitHub Release with the artifacts
3. Generate release notes automatically

## 🎨 UI Components

Built with [Shadcn/UI](https://ui.shadcn.com/) for consistent, accessible components:

- Button, Input, Label, Textarea
- Card, Dialog, Popover, Tooltip
- Table, Tabs, Select
- Calendar, DatePicker
- Avatar, Badge, Skeleton, Separator

## 📊 Database Schema

```
┌─────────────┐     ┌─────────────┐
│   Patient   │────<│ Appointment │>────│   Doctor    │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Invoice   │────<│ InvoiceItem │>────│   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│   Payment   │
└─────────────┘
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Prisma](https://www.prisma.io/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

Made with ❤️ by Tansiq

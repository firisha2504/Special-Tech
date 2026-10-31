# SPECIAL TECH
## Complete AI-Powered Software Development Company Website & Interactive Prototype Platform

> **"INNOVATION • INTELLIGENCE • SOLUTIONS"**

SPECIAL TECH is a state-of-the-art AI-powered software engineering platform designed to help prospective clients articulate their business ideas, generate detailed engineering specifications, and preview interactive, clickable software prototypes before hiring our elite development team.

---

## 🚀 Key Platform Features

1. **Brand Identity & Official Logo**
   - Distinctive geometric 3D-style letter **S** ribbon symbol with vibrant blue-to-cyan gradient lighting on a deep navy background.
   - Wordmark: **SPECIAL TECH** with tagline: **INNOVATION • INTELLIGENCE • SOLUTIONS**.
   - Variations: Full official logo, trimmed horizontal navbar logo, square 3D S avatar icon, and browser favicon.
   - Color System: Primary Navy (`#020D20`), Dark Navy (`#07172E`), Card (`#0B1F3A`), Primary Blue (`#087BFF`), Electric Blue (`#0066FF`), Cyan (`#08D9E8`), Muted (`#A7B8D0`), Borders (`rgba(60, 140, 255, 0.2)`).

2. **AI Project Assistant & Software Business Analyst**
   - Natural language requirement discovery engine that guides customers without technical jargon.
   - Asks 1-2 targeted questions at a time about user roles, workflows, and modules.
   - Synthesizes full **Project Specifications**: Project Overview, Problem Statement, Objectives, Target Users, User Roles, Functional & Non-Functional Requirements, Modules, and Recommended Tech Stack.

3. **AI Interactive Prototype Generator**
   - Pre-configured and generative blueprints for 8+ enterprise system categories:
     - School Management ERP
     - Hospital & Clinic Management System
     - E-Commerce & Multi-Vendor Marketplace
     - Inventory & Warehouse Logistics Hub
     - Hotel & Hospitality Booking Suite
     - Employee & HR Workforce Platform
     - Restaurant & Kitchen Display POS
     - Custom Business Operations System
   - Live interactive components: KPI statistics cards, filterable/searchable data tables with status badges, interactive SVG charts (bar & donut), and functional data entry modal popups.
   - Multi-device preview frames: **Desktop (100%)**, **Tablet (768px)**, and **Mobile (390px)**.
   - **Real-Time AI Modification Drawer**: Prompt AI in plain English (e.g., *"Add parent messaging module"*, *"Change theme to violet"*), immediately triggering safe JSON configuration updates and version incrementing (`v1` → `v2`).

4. **Client Project Submission & PDF Specification**
   - Customers submit proposals with linked requirements, prototype versions, and budget estimates.
   - Automatic generation of a unique inquiry tracking number (`ST-INQ-2026-XXXX`).
   - Automated server-side PDF generation using PDFKit for download.

5. **Administrative Management Control Center (`/admin`)**
   - Secure JWT authentication with bcrypt password hashing.
   - Dashboard KPI analytics: Inquiries, In-Review, Active Projects, Total Customers, and Recent Activity Stream.
   - Complete Inquiries CRM with status updating, internal notes, and direct PDF downloads.
   - AI Engine Configuration: Provider selection (Gemini API, OpenAI, or Built-In engine), API keys, and model parameters.

6. **100% PostgreSQL Architecture via Prisma ORM**
   - Exclusively powered by PostgreSQL with 14 relational models:
     `User`, `Customer`, `TeamMember`, `Project`, `Service`, `Inquiry`, `Conversation`, `Message`, `Requirement`, `Prototype`, `PrototypeVersion`, `Notification`, `AdminSetting`, and `ActivityLog`.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS with custom glassmorphism and glow utilities
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React + custom brand SVGs
- **HTTP Client**: Axios
- **Effects**: Canvas Confetti

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: PostgreSQL (v18.6)
- **ORM**: Prisma ORM (v6.4)
- **Authentication**: JWT & bcryptjs
- **Validation**: Zod schema validation
- **PDF Generation**: PDFKit
- **Email Dispatch**: Nodemailer

---

## ⚡ Quick Start & Startup Commands

### 1. Database Setup
Ensure PostgreSQL is running on `localhost:5432` with database `special_tech`.

```bash
cd backend
# Database URL is configured in backend/.env:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/special_tech?schema=public"

# Push schema and generate Prisma client
npx prisma db push
npx prisma generate

# Seed sample data (admin user, team members, services, projects, prototype blueprints)
node prisma/seed.js
```

### 2. Start Backend API Server (Port 5050)
```bash
cd backend
npm run dev
# Running on http://localhost:5050
```

### 3. Start Frontend Development Server (Port 5174)
```bash
cd frontend
npm run dev
# Running on http://localhost:5174
```

---

## 🔑 Default Administrator Credentials

- **URL**: `http://localhost:5174/admin`
- **Email**: `admin@specialtech.com`
- **Password**: `Admin@123456`

---

## 📂 Project Structure

```
Special Tech/
├── frontend/
│   ├── public/
│   │   ├── logo/
│   │   │   ├── special-tech-icon.svg
│   │   │   ├── special-tech-horizontal-dark.svg
│   │   │   ├── special-tech-horizontal-light.svg
│   │   │   ├── special-tech-primary-dark.svg
│   │   │   └── special-tech-primary-light.svg
│   │   └── favicon.svg
│   └── src/
│       ├── assets/
│       ├── components/
│       │   └── common/ (Logo.jsx, Navbar.jsx, Footer.jsx)
│       ├── context/ (ThemeContext.jsx, AuthContext.jsx)
│       ├── features/
│       │   └── prototype/ (PrototypeWorkspace.jsx, SystemTable.jsx, SystemChart.jsx, SystemModalForm.jsx)
│       ├── layouts/ (PublicLayout.jsx)
│       ├── pages/ (HomePage.jsx, AboutPage.jsx, ServicesPage.jsx, ProjectsPage.jsx, ContactPage.jsx, AIAssistantPage.jsx, AdminDashboardPage.jsx)
│       └── services/ (api.js)
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/ (db.js)
│   │   ├── controllers/ (auth, project, service, ai, prototype, inquiry, admin)
│   │   ├── middleware/ (auth, error, upload)
│   │   ├── routes/ (auth, project, service, ai, prototype, inquiry, admin)
│   │   ├── services/
│   │   │   ├── ai/ (aiService.js)
│   │   │   ├── prototype/ (prototypeService.js)
│   │   │   ├── pdf/ (pdfService.js)
│   │   │   └── email/ (emailService.js)
│   │   └── server.js
│   ├── .env
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 🛡 Security & Performance
- **Safe Prototype Rendering**: No arbitrary code execution. All mockups are strictly driven by validated JSON models.
- **Strict PostgreSQL Foreign Keys & Cascading**: Automated cleanup and data integrity.
- **CORS & Rate Limiting**: Production-grade middleware protecting API routes.

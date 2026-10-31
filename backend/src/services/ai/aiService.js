import prisma from '../../config/db.js';

/**
 * Intelligent Software Business Analyst System
 * Integrates with Gemini / OpenAI when API keys are available,
 * and features a comprehensive built-in business analysis engine.
 */

// Preset system classification heuristics
const SYSTEM_PATTERNS = [
  {
    type: 'SCHOOL_MANAGEMENT',
    keywords: ['school', 'student', 'teacher', 'attendance', 'grade', 'class', 'college', 'university', 'curriculum', 'exam'],
    defaultName: 'Smart Campus Management ERP',
  },
  {
    type: 'HOSPITAL_MANAGEMENT',
    keywords: ['hospital', 'clinic', 'doctor', 'patient', 'medical', 'prescription', 'pharmacy', 'health', 'appointment', 'ehr'],
    defaultName: 'MedPulse Healthcare Cloud Suite',
  },
  {
    type: 'ECOMMERCE_SYSTEM',
    keywords: ['ecommerce', 'e-commerce', 'shop', 'store', 'cart', 'product', 'order', 'payment', 'checkout', 'vendor', 'sell'],
    defaultName: 'AuraCommerce Multi-Vendor Platform',
  },
  {
    type: 'INVENTORY_MANAGEMENT',
    keywords: ['inventory', 'warehouse', 'stock', 'supplier', 'supply chain', 'sku', 'barcode', 'procurement', 'logistics'],
    defaultName: 'StockFlow Enterprise Warehouse & Inventory',
  },
  {
    type: 'HOTEL_MANAGEMENT',
    keywords: ['hotel', 'resort', 'room', 'booking', 'guest', 'reservation', 'check-in', 'amenity', 'reception'],
    defaultName: 'GrandHorizon Hospitality Suite',
  },
  {
    type: 'EMPLOYEE_MANAGEMENT',
    keywords: ['employee', 'hr', 'payroll', 'human resources', 'leave', 'performance', 'recruitment', 'timesheet', 'staff'],
    defaultName: 'PulseHR Workforce & Payroll Platform',
  },
  {
    type: 'RESTAURANT_MANAGEMENT',
    keywords: ['restaurant', 'food', 'table', 'menu', 'kitchen', 'order', 'pos', 'dining', 'chef', 'cafe'],
    defaultName: 'RestoPro Dining & Kitchen Display System',
  },
];

export const detectSystemType = (text = '') => {
  const lower = text.toLowerCase();
  for (const pattern of SYSTEM_PATTERNS) {
    if (pattern.keywords.some((kw) => lower.includes(kw))) {
      return pattern;
    }
  }
  return {
    type: 'CUSTOM_BUSINESS_SYSTEM',
    keywords: [],
    defaultName: 'Custom Enterprise Business System',
  };
};

export const generateAIResponse = async (conversation, userMessage) => {
  // Check if Gemini or OpenAI key is set in environment or Admin Settings
  const geminiKeySetting = await prisma.adminSetting.findUnique({ where: { key: 'gemini_api_key' } });
  const apiKey = process.env.GEMINI_API_KEY || (geminiKeySetting ? geminiKeySetting.value : null);

  if (apiKey) {
    try {
      // Call Google Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are the Senior Software Business Analyst for SPECIAL TECH, an elite AI-powered software development company.
Your role is to guide customers who have software ideas, help them define requirements, target audience, modules, and architecture in simple, encouraging, and non-intimidating language.
Ask 1 or 2 targeted, clarifying questions at a time. Do not overwhelm them.

Conversation history:
${conversation.messages.map((m) => `${m.sender}: ${m.content}`).join('\n')}

Customer's latest message:
"${userMessage}"

Respond as Special Tech Senior Business Analyst:`,
                },
              ],
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) return aiText.trim();
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to intelligent conversational engine:', err.message);
    }
  }

  // Built-in Software Business Analyst Conversational Engine
  const historyCount = conversation.messages.length;
  const sysInfo = detectSystemType(userMessage + ' ' + conversation.messages.map((m) => m.content).join(' '));

  if (historyCount <= 2) {
    // Step 1: Understand idea & scope
    if (sysInfo.type === 'SCHOOL_MANAGEMENT') {
      return `That is a fantastic software project! A school management system brings tremendous efficiency to administration, teachers, and parents.\n\nTo tailor the right architecture: What level of institution is this for (K-12, secondary high school, college, or multi-campus university)? And roughly how many students and faculty members will use it?`;
    } else if (sysInfo.type === 'HOSPITAL_MANAGEMENT') {
      return `Healthcare software is one of our primary specialties! A digital clinic or hospital suite reduces patient wait times and eliminates record errors.\n\nFirst, is this for a specialized private clinic, a multi-specialty hospital, or a diagnostic laboratory center? Do you need integrated pharmacy and billing?`;
    } else if (sysInfo.type === 'ECOMMERCE_SYSTEM') {
      return `An e-commerce platform is a great revenue generator! Building custom allows you to avoid high marketplace commissions.\n\nWill this be a direct single-brand store for your own products, or a multi-vendor marketplace where external merchants can register and sell their items?`;
    } else if (sysInfo.type === 'INVENTORY_MANAGEMENT') {
      return `Optimizing inventory flow directly cuts operational overhead and stock shortages.\n\nDoes your business manage a single physical warehouse or multiple retail branches? And do you need barcode/QR scanning and automatic low-stock purchase orders?`;
    } else {
      return `That sounds like a high-impact digital project! We love turning unique business concepts into reality.\n\nTo help shape the right software blueprint: Who are your primary target users, and what is the biggest manual headache or bottleneck this system will eliminate for them?`;
    }
  } else if (historyCount <= 4) {
    // Step 2: User roles, key modules, and user experience
    return `That gives us crystal-clear direction! Based on your workflow, we can design role-tailored dashboards so every user has an intuitive, distraction-free experience.\n\nNext, what user roles should have access (for example: Super Admin, Staff, Customers, and Managers)? And are there specific mobile capabilities or instant SMS/Email notifications needed?`;
  } else {
    // Step 3: Synthesis & ready for specification and interactive prototype
    return `Perfect! We now have everything needed to architect your system.\n\nI have synthesized your requirements and generated a comprehensive Project Specification and an Interactive Visual Prototype.\n\nYou can review the specifications in the panel, explore the live clickable prototype modules, and submit the project whenever you are ready!`;
  }
};

/**
 * Generate Structured Project Specification (Requirement model)
 */
export const generateProjectSpecification = async (conversation) => {
  const allText = conversation.messages.map((m) => m.content).join(' ');
  const detected = detectSystemType(allText);

  // Default blueprints based on system type
  const blueprints = {
    SCHOOL_MANAGEMENT: {
      name: 'EduCloud Pro - School Management System',
      overview: 'A centralized institutional ERP designed to automate student admissions, daily attendance, grade recording, timetable coordination, and parent fee collection.',
      problemStatement: 'Manual paper-based record keeping, delayed report card distribution, and high administrative friction in collecting school fees.',
      objectives: [
        'Streamline the entire student academic lifecycle from enrollment to graduation',
        'Enable one-click daily attendance and rapid parent notification alerts',
        'Automate report card generation and GPA calculations according to curriculum standards',
        'Provide transparent online payment processing for school tuition and bus fees',
      ],
      targetUsers: ['School Administrators', 'Academic Instructors', 'Students', 'Parents & Guardians', 'Bursar & Accounting'],
      userRoles: [
        { role: 'Administrator', permissions: 'Full system management, staff allocations, and institution settings' },
        { role: 'Teacher', permissions: 'Attendance recording, marksheets, homework assignments, and pupil remarks' },
        { role: 'Parent', permissions: 'View child academic progress, attendance log, and online tuition payments' },
        { role: 'Student', permissions: 'View class schedule, homework tasks, exam results, and study resources' },
      ],
      functionalReqs: [
        'Student Profile & Admission Management with document uploads',
        'Real-time Class Attendance Tracker with automated absentee alerts',
        'Examination & Grading Engine supporting customizable grading scales and PDF report cards',
        'Tuition Billing & Invoicing with debit card and bank transfer support',
        'Interactive Academic Calendar and Timetable Manager',
      ],
      nonFunctionalReqs: [
        'Security: Role-based authorization and encrypted student personal data',
        'Performance: Fast sub-second page response even during term-end peak loads',
        'Availability: 99.9% uptime with automated daily cloud database backups',
        'Responsiveness: Accessible across desktop, tablet, and smartphone browsers',
      ],
      modules: [
        { name: 'Dashboard', desc: 'Real-time KPIs on attendance rates, active students, and tuition revenue' },
        { name: 'Students', desc: 'Directory, admission forms, class rosters, and student academic files' },
        { name: 'Teachers', desc: 'Faculty registry, assigned subjects, and teaching workload' },
        { name: 'Attendance', desc: 'Daily period-by-period attendance grid and absentee statistics' },
        { name: 'Fee Management', desc: 'Tuition invoices, pending balances, payment receipts, and reconciliation' },
        { name: 'Reports & Grades', desc: 'Automated term grade reports with instant PDF export' },
      ],
      recommendedTech: [
        { layer: 'Frontend', technology: 'React + Tailwind CSS for a modern, responsive user experience' },
        { layer: 'Backend', technology: 'Node.js Express RESTful API with structured service architecture' },
        { layer: 'Database', technology: 'PostgreSQL with Prisma ORM for relational integrity' },
        { layer: 'Export Engine', technology: 'PDFKit for automated server-side report card generation' },
      ],
      deliverables: [
        'Production-ready Web Application (Admin & Portal interfaces)',
        'PostgreSQL Database Schema & Migration files',
        'Complete Source Code with technical documentation',
        'Deployment on Cloud Infrastructure (Docker / VPS / AWS)',
        '6 Months SLA Support and Maintenance',
      ],
    },
    HOSPITAL_MANAGEMENT: {
      name: 'CarePulse Cloud - Hospital & Clinic Management System',
      overview: 'An integrated healthcare information system unifying patient EHR records, doctor consultations, laboratory diagnostics, and pharmacy inventory.',
      problemStatement: 'Disjointed patient records, long waiting room queues, medication dispensing errors, and billing delays.',
      objectives: [
        'Provide a single, secure electronic medical record for every patient',
        'Coordinate doctor schedules and reduce patient waiting times',
        'Integrate pharmacy inventory with digital doctor prescriptions',
        'Ensure strict patient confidentiality and HIPAA-compliant data practices',
      ],
      targetUsers: ['Chief Medical Officer', 'Physicians & Doctors', 'Nurses & Triage Staff', 'Pharmacists', 'Lab Technicians', 'Patients'],
      userRoles: [
        { role: 'Doctor', permissions: 'View patient medical history, write clinical notes, prescribe drugs' },
        { role: 'Nurse / Triage', permissions: 'Record vital signs, triage urgency level, assign examination rooms' },
        { role: 'Pharmacist', permissions: 'Dispense prescribed medication, update batch expiry and stock' },
        { role: 'Receptionist', permissions: 'Patient check-in, doctor appointment booking, billing' },
      ],
      functionalReqs: [
        'Patient Electronic Health Records (EHR) with medical history and allergy warnings',
        'Doctor Appointment & Consultation Scheduling Grid',
        'Digital Prescription and Automated Pharmacy Dispensation',
        'Laboratory Test Requisition and Result Uploads',
        'Patient Billing, Insurance Claim Tagging, and Invoicing',
      ],
      nonFunctionalReqs: [
        'Compliance: HIPAA-compliant data encryption and audit log tracing',
        'Reliability: 99.99% high availability for critical emergency access',
        'Performance: Instant record retrieval under 500ms',
      ],
      modules: [
        { name: 'Hospital Dashboard', desc: 'Bed occupancy rate, patient admissions, outpatient queue, and revenue' },
        { name: 'Patients', desc: 'Comprehensive medical history, vitals, and visit timeline' },
        { name: 'Doctors & Appointments', desc: 'Doctor duty rosters, consultation bookings, and calendar' },
        { name: 'Pharmacy', desc: 'Drug formulary, inventory alerts, batch numbers, and dispensary' },
        { name: 'Billing & Insurance', desc: 'Outpatient invoices, procedure charges, and payment tracking' },
      ],
      recommendedTech: [
        { layer: 'Frontend', technology: 'React, Tailwind CSS, Framer Motion for crisp medical UI' },
        { layer: 'Backend', technology: 'Node.js Express with role-based JWT security' },
        { layer: 'Database', technology: 'PostgreSQL with Prisma ORM and encrypted JSONB fields' },
      ],
      deliverables: [
        'Hospital Web Application Suite with Multi-role Portals',
        'HIPAA-Compliant PostgreSQL Database Setup',
        'Documentation & Role Access Matrix',
        'Production Cloud Deployment with SSL & Automated Backups',
      ],
    },
    ECOMMERCE_SYSTEM: {
      name: 'OmniTrade - Modern E-Commerce Platform',
      overview: 'A high-conversion digital marketplace engineered for lightning-fast product catalog browsing, mobile checkout, and automated fulfillment.',
      problemStatement: 'Slow cart checkout experiences, high marketplace fees on third-party platforms, and inventory synchronization mismatches.',
      objectives: [
        'Maximize cart conversion with a frictionless 2-step checkout flow',
        'Synchronize inventory in real-time across multiple sales channels',
        'Engage customers with automated email order notifications and tracking',
      ],
      targetUsers: ['Online Shoppers', 'Store Managers', 'Fulfillment Staff', 'Marketing Team'],
      userRoles: [
        { role: 'Store Admin', permissions: 'Manage products, prices, discount coupons, and financial payouts' },
        { role: 'Order Manager', permissions: 'Process orders, print shipping labels, update tracking numbers' },
        { role: 'Customer', permissions: 'Browse catalog, manage wishlist, cart, orders, and saved addresses' },
      ],
      functionalReqs: [
        'Product Catalog with instant fuzzy search, filters, and image zoom',
        'Persistent Shopping Cart & Wishlist with guest checkout option',
        'Secure Payment Processing with Stripe, PayPal, and local gateways',
        'Order Lifecycle Management (Pending, Processing, Shipped, Delivered)',
        'Discount Code Engine & Promotional Banner Manager',
      ],
      nonFunctionalReqs: [
        'Speed: Sub-second catalog browsing and optimized WebP images',
        'Security: PCI-DSS compliance and secure HTTPS tokenized payments',
        'Scalability: Handles high concurrent traffic during seasonal sales campaigns',
      ],
      modules: [
        { name: 'Storefront', desc: 'Customer-facing product catalog, featured hero, and categories' },
        { name: 'Orders Management', desc: 'Real-time order pipeline, shipping tracking, and invoices' },
        { name: 'Product Inventory', desc: 'SKU inventory, variants (size/color), and low-stock warnings' },
        { name: 'Customers', desc: 'Customer accounts, purchase lifetime value, and order history' },
        { name: 'Analytics', desc: 'Sales revenue trends, cart abandonment rates, and top sellers' },
      ],
      recommendedTech: [
        { layer: 'Frontend', technology: 'React + Tailwind CSS for snappy client-side navigation' },
        { layer: 'Backend', technology: 'Node.js Express REST API with Stripe Webhooks' },
        { layer: 'Database', technology: 'PostgreSQL with Prisma ORM for ACID financial transactions' },
      ],
      deliverables: [
        'Customer Storefront and Admin Management Portal',
        'Integrated Payment Gateway (Stripe / Credit Card)',
        'Database Schema & Seeded Demo Catalog',
        'Deployment on CDN and Cloud Host',
      ],
    },
    INVENTORY_MANAGEMENT: {
      name: 'ApexStock - Enterprise Inventory & Warehouse System',
      overview: 'A robust inventory control and supply chain management suite featuring multi-warehouse tracking, stock reorder alerts, and supplier procurement.',
      problemStatement: 'Manual stock spreadsheets leading to stockouts, expired goods, misplaced warehouse bins, and purchase order delays.',
      objectives: [
        'Provide real-time inventory visibility across all warehouses and retail shelves',
        'Automate reorder alerts before high-velocity items go out of stock',
        'Streamline supplier purchase orders and receiving inspection workflows',
      ],
      targetUsers: ['Warehouse Managers', 'Procurement Officers', 'Inventory Clerks', 'Finance Directors'],
      userRoles: [
        { role: 'Warehouse Director', permissions: 'Full warehouse controls, inventory adjustments, supplier contracts' },
        { role: 'Inventory Clerk', permissions: 'Barcode scanning, stock in/out logging, bin location updates' },
        { role: 'Procurement Specialist', permissions: 'Issue purchase orders, track supplier shipments' },
      ],
      functionalReqs: [
        'SKU & Barcode tracking with multi-location bin allocation',
        'Automated Minimum Stock Thresholds and Reorder Triggers',
        'Supplier Database and Purchase Order Generation',
        'Batch & Serial Number Tracking with Expiration Date Monitoring',
        'Stock Valuation Reports (FIFO / LIFO / Average Cost)',
      ],
      nonFunctionalReqs: [
        'Data Accuracy: Strict database transactions preventing negative inventory counts',
        'Auditability: Complete timestamped audit trail of every stock movement',
        'Offline Support: Fast barcode scanner response',
      ],
      modules: [
        { name: 'Dashboard', desc: 'Total inventory value, low-stock warnings, and top moving SKUs' },
        { name: 'Stock Items', desc: 'Catalog of items, categories, SKUs, and current quantity on hand' },
        { name: 'Warehouse Locations', desc: 'Bin, shelf, and warehouse multi-location tracking' },
        { name: 'Purchase Orders', desc: 'Supplier order creation, delivery tracking, and receiving logs' },
        { name: 'Reports', desc: 'Inventory turnover rate, dead stock analysis, and valuation' },
      ],
      recommendedTech: [
        { layer: 'Frontend', technology: 'React, Tailwind CSS, Lucide icons' },
        { layer: 'Backend', technology: 'Node.js Express with Prisma transactions' },
        { layer: 'Database', technology: 'PostgreSQL for strict ACID relational inventory data' },
      ],
      deliverables: [
        'Warehouse Inventory Web Application',
        'PostgreSQL Database Architecture & Migrations',
        'Barcode / QR Scanner Integration Modules',
        'Complete Source Code and Cloud Setup',
      ],
    },
    CUSTOM_BUSINESS_SYSTEM: {
      name: 'NexusEnterprise - Custom Business Management Platform',
      overview: 'A fully tailored software solution engineered around your company\'s specific workflows, operational teams, and business goals.',
      problemStatement: 'Off-the-shelf software packages are too rigid, expensive, and do not fit your distinct competitive processes.',
      objectives: [
        'Digitize unique operational processes into a unified web platform',
        'Automate repetitive manual data transfers between teams',
        'Give executive leadership real-time KPI visibility and business intelligence',
      ],
      targetUsers: ['Operations Executives', 'Team Members', 'External Clients', 'Financial Analysts'],
      userRoles: [
        { role: 'Executive Administrator', permissions: 'Complete system oversight and company-wide configurations' },
        { role: 'Operations Staff', permissions: 'Daily workflow execution, customer record handling, status updates' },
        { role: 'Client Portal User', permissions: 'View project status, submit requests, approve deliverables' },
      ],
      functionalReqs: [
        'Custom Workflow Engine matching your team\'s exact stages',
        'Integrated Client Portal with real-time status updates',
        'Custom Invoicing and Financial Accounting modules',
        'Automated Email & Push Notification Dispatcher',
        'Custom Analytics Dashboard and Report Exporter',
      ],
      nonFunctionalReqs: [
        'Customizability: Modular component-based frontend for easy future expansion',
        'Security: Encrypted database columns and strict role access controls',
        'Performance: Optimized SQL queries with Prisma connection pooling',
      ],
      modules: [
        { name: 'Operations Dashboard', desc: 'Executive KPI cards, ongoing initiatives, and activity feed' },
        { name: 'Clients & Accounts', desc: 'Client directory, active engagements, and contact timeline' },
        { name: 'Workflow Pipeline', desc: 'Kanban and table view of operational tasks and approvals' },
        { name: 'Finance & Invoices', desc: 'Billing, payments, expenses, and profit margin analysis' },
        { name: 'Reports', desc: 'Comprehensive business analytics and downloadable PDF summaries' },
      ],
      recommendedTech: [
        { layer: 'Frontend', technology: 'React, Tailwind CSS, Framer Motion for responsive UI' },
        { layer: 'Backend', technology: 'Node.js Express REST API with Prisma ORM' },
        { layer: 'Database', technology: 'PostgreSQL with JSONB flexible schema support' },
      ],
      deliverables: [
        'Complete Custom Business Platform Source Code',
        'PostgreSQL Database Setup & Seed Scripts',
        'Interactive Administrator & Client Portals',
        'Production Deployment and Documentation',
      ],
    },
  };

  const selectedBlueprint = blueprints[detected.type] || blueprints.CUSTOM_BUSINESS_SYSTEM;

  // Create or update Requirement record in PostgreSQL via Prisma
  const requirement = await prisma.requirement.create({
    data: {
      conversationId: conversation.id,
      projectName: selectedBlueprint.name,
      overview: selectedBlueprint.overview,
      problemStatement: selectedBlueprint.problemStatement,
      objectives: selectedBlueprint.objectives,
      targetUsers: selectedBlueprint.targetUsers,
      userRoles: selectedBlueprint.userRoles,
      functionalReqs: selectedBlueprint.functionalReqs,
      nonFunctionalReqs: selectedBlueprint.nonFunctionalReqs,
      modules: selectedBlueprint.modules,
      recommendedTech: selectedBlueprint.recommendedTech,
      deliverables: selectedBlueprint.deliverables,
      status: 'DRAFT',
      version: 1,
    },
  });

  return requirement;
};

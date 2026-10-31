import { PrismaClient, Role, InquiryStatus, Priority, MessageSender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Special Tech database seeding...');

  // Clean existing records if any
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.productDemoRequest.deleteMany({});
  await prisma.productPlan.deleteMany({});
  await prisma.productFeature.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.projectImage.deleteMany({});
  await prisma.inquiry.deleteMany({});
  await prisma.prototypeVersion.deleteMany({});
  await prisma.prototype.deleteMany({});
  await prisma.requirement.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.adminSetting.deleteMany({});

  // 1. Admin & Team Users
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@specialtech.com',
      name: 'Alexander Wright',
      passwordHash,
      role: Role.ADMIN,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      isActive: true,
    },
  });

  const devUser = await prisma.user.create({
    data: {
      email: 'engineer@specialtech.com',
      name: 'Elena Rostova',
      passwordHash,
      role: Role.DEVELOPER,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      isActive: true,
    },
  });

  console.log(`✅ Users created: ${adminUser.email}, ${devUser.email}`);

  // 2. Team Members (Public Display)
  const teamMembers = [
    {
      name: 'Marcus Vance',
      role: 'Chief Technology Officer & Lead Architect',
      bio: 'Ex-Google software architect with 12+ years building high-throughput distributed systems and enterprise software.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      skills: ['System Architecture', 'PostgreSQL', 'Cloud Scalability', 'Node.js', 'AI Systems'],
      email: 'marcus@specialtech.com',
    },
    {
      name: 'Elena Rostova',
      role: 'Lead AI & Machine Learning Engineer',
      bio: 'Specialist in generative AI orchestration, intelligent agent systems, and automated requirement-to-code pipelines.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      skills: ['LLM Orchestration', 'Prompt Engineering', 'Python', 'Vector DBs', 'NLP'],
      email: 'elena@specialtech.com',
    },
    {
      name: 'Julian Mercer',
      role: 'Senior Product Designer & UI/UX Director',
      bio: 'Award-winning product designer crafting futuristic, accessible, and high-conversion software interfaces for Fortune 500s.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      skills: ['Design Systems', 'Figma', 'Interactive Prototypes', 'User Research', 'Motion UI'],
      email: 'julian@specialtech.com',
    },
    {
      name: 'Sophia Chen',
      role: 'Senior Full-Stack & Frontend Architect',
      bio: 'Performance fanatic specializing in ultra-fast React architectures, responsive design systems, and real-time platforms.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'WebSockets'],
      email: 'sophia@specialtech.com',
    },
  ];

  for (const member of teamMembers) {
    await prisma.teamMember.create({ data: member });
  }
  console.log(`✅ ${teamMembers.length} Team Members seeded`);

  // 3. Core Services
  const services = [
    {
      title: 'Custom Software Development',
      slug: 'custom-software-development',
      icon: 'Code2',
      description: 'End-to-end engineered software built specifically to solve your organization\'s unique operational challenges and scale effortlessly.',
      problemsSolv: [
        'Out-of-the-box software that fails to meet complex workflows',
        'Fragmented spreadsheets and disconnected legacy tools',
        'Bottlenecks in manual operational processes',
      ],
      benefits: [
        '100% tailored architecture fitting your exact business logic',
        'Complete ownership of source code and proprietary IP',
        'Zero per-seat licensing fees or vendor lock-in',
      ],
      features: [
        'Domain-Driven Architecture',
        'Modular & Maintainable Codebases',
        'Enterprise Security & Encryption',
        'Continuous Integration & Automated Testing',
      ],
      technologies: ['Node.js', 'React', 'PostgreSQL', 'Prisma', 'Docker', 'TypeScript'],
      sortOrder: 1,
    },
    {
      title: 'Web Application Development',
      slug: 'web-application-development',
      icon: 'Globe',
      description: 'Ultra-responsive, accessible, and high-performance modern web apps that delight users and drive real business conversions.',
      problemsSolv: [
        'Slow and outdated web applications that frustrate users',
        'Inability to scale under sudden traffic surges',
        'Poor mobile and cross-browser experiences',
      ],
      benefits: [
        'Lightning-fast page loads and interactive real-time performance',
        'Flawless responsive experience on Desktop, Tablet, and Mobile',
        'Modern microservice and API-first architectures',
      ],
      features: [
        'Single Page Applications (SPAs) & SSR',
        'Real-time WebSocket Data Feeds',
        'Progressive Web App (PWA) Offline Capabilities',
        'Robust State Management & Cache Optimization',
      ],
      technologies: ['React', 'Vite', 'Tailwind CSS', 'Express', 'Redis', 'PostgreSQL'],
      sortOrder: 2,
    },
    {
      title: 'Mobile Application Development',
      slug: 'mobile-application-development',
      icon: 'Smartphone',
      description: 'Native and cross-platform iOS and Android mobile apps engineered for fluid 60fps animations and robust offline functionality.',
      problemsSolv: [
        'Expensive separate development cycles for iOS and Android',
        'Sluggish hybrid apps that suffer from poor user retention',
        'Lack of native device hardware integration',
      ],
      benefits: [
        'Single unified codebase cutting time-to-market by 50%',
        'Silky smooth 60fps animations and native UX feel',
        'Seamless push notifications and device biometric auth',
      ],
      features: [
        'Cross-platform iOS & Android Deployment',
        'Offline-First SQLite / Local Storage Sync',
        'Hardware Camera, GPS & Biometrics Integration',
        'App Store & Play Store Compliance Management',
      ],
      technologies: ['React Native', 'Expo', 'iOS Swift', 'Android Kotlin', 'REST APIs'],
      sortOrder: 3,
    },
    {
      title: 'AI Integration & Automation',
      slug: 'ai-integration-automation',
      icon: 'Cpu',
      description: 'Empower your existing digital systems with intelligent LLM assistants, automated document parsers, and custom prediction models.',
      problemsSolv: [
        'Repetitive manual data entry and customer support load',
        'Inability to extract insights from unstructured documents',
        'Slow response times to client inquiries and orders',
      ],
      benefits: [
        '24/7 autonomous intelligent customer support & triage',
        'Automated document ingestion and structured data extraction',
        'Over 70% reduction in routine manual operational labor',
      ],
      features: [
        'LLM & RAG Custom Knowledge Retrievers',
        'Autonomous Workflow Automation Agents',
        'Natural Language Semantic Search',
        'Predictive Analytics & Recommendation Engines',
      ],
      technologies: ['OpenAI / Gemini APIs', 'LangChain', 'pgvector', 'Python', 'FastAPI'],
      sortOrder: 4,
    },
    {
      title: 'UI/UX Design & Prototyping',
      slug: 'ui-ux-design',
      icon: 'Palette',
      description: 'Futuristic, human-centric user interfaces designed with deep psychological empathy and converted into interactive prototypes.',
      problemsSolv: [
        'Confusing interfaces that drive away paying customers',
        'High development rework costs from ambiguous wireframes',
        'Inconsistent visual brand identity across digital touchpoints',
      ],
      benefits: [
        'Interactive clickable prototypes before a single line of code is written',
        'Significantly higher user satisfaction and conversion rates',
        'Comprehensive design tokens and component design libraries',
      ],
      features: [
        'Interactive High-Fidelity Prototypes',
        'Atomic Design System Architecture',
        'User Journey Mapping & Usability Testing',
        'Dark & Light Mode Color Tokens',
      ],
      technologies: ['Figma', 'Framer Motion', 'Tailwind CSS', 'Design Systems', 'Micro-Interactions'],
      sortOrder: 5,
    },
    {
      title: 'Database Design & Management',
      slug: 'database-design-management',
      icon: 'Database',
      description: 'Normalized, high-integrity PostgreSQL database architectures optimized for zero-latency queries, indexing, and backup security.',
      problemsSolv: [
        'Slow SQL queries that crash applications during peak hours',
        'Data anomalies, corrupted records, and orphan references',
        'Lack of automated disaster recovery and transaction rollbacks',
      ],
      benefits: [
        'Sub-10ms query execution times even with millions of rows',
        'Strict ACID compliance and relational integrity constraints',
        'Seamless schema migrations without application downtime',
      ],
      features: [
        'Relational Normalization & Advanced Indexing',
        'Prisma ORM & Migration Pipelines',
        'Automated Point-in-Time Recovery (PITR)',
        'Connection Pooling & Read-Replica Optimization',
      ],
      technologies: ['PostgreSQL', 'Prisma ORM', 'Redis Cache', 'PgBouncer', 'SQL'],
      sortOrder: 6,
    },
    {
      title: 'System Maintenance & Support',
      slug: 'system-maintenance-support',
      icon: 'ShieldCheck',
      description: 'Proactive 24/7 monitoring, security vulnerability patching, uptime guarantees, and ongoing feature enhancements.',
      problemsSolv: [
        'Unforeseen server crashes and catastrophic data loss',
        'Unpatched security vulnerabilities and zero-day threats',
        'Software degrading over time due to outdated dependencies',
      ],
      benefits: [
        '99.9% uptime Service Level Agreement (SLA)',
        'Dedicated technical lead responding within minutes',
        'Peace of mind knowing your digital assets are guarded 24/7',
      ],
      features: [
        '24/7 Server Health & Performance Telemetry',
        'Automated Nightly Backups & Integrity Tests',
        'Security Auditing & Dependency Upgrades',
        'Priority Bug Resolution & SLA Guarantee',
      ],
      technologies: ['Grafana', 'Prometheus', 'Docker', 'AWS / DigitalOcean', 'Linux'],
      sortOrder: 7,
    },
    {
      title: 'IT Consulting & Technology Strategy',
      slug: 'it-consulting',
      icon: 'Compass',
      description: 'Strategic architectural guidance to help executive leadership select the right software stack, minimize costs, and maximize ROI.',
      problemsSolv: [
        'Wasted hundreds of thousands on wrong technology stacks',
        'Unscalable architectural choices that stall growth',
        'Lack of technical leadership in non-technical founding teams',
      ],
      benefits: [
        'Clear, actionable technology roadmaps and cost forecasts',
        'Independent code review and technical due diligence',
        'Optimized cloud infrastructure spending by up to 45%',
      ],
      features: [
        'Fractional CTO & Architectural Leadership',
        'Cloud Infrastructure & Cost Optimization Audits',
        'Software Feasibility & Risk Assessments',
        'Security Compliance & Architecture Roadmaps',
      ],
      technologies: ['Architecture Reviews', 'Cloud Cost Audits', 'Security Frameworks', 'DevOps'],
      sortOrder: 8,
    },
  ];

  for (const s of services) {
    await prisma.service.create({ data: s });
  }
  console.log(`✅ ${services.length} Services seeded`);

  // 4. Portfolio Projects
  const projects = [
    {
      title: 'EduNexus - School Management System',
      slug: 'edunexus-school-management',
      category: 'Web Applications',
      shortDesc: 'A complete institutional ERP managing student enrollments, gradebooks, attendance, parent portal, and automated fee processing.',
      description: 'EduNexus was built for academic institutions seeking to streamline their daily operations. The platform connects students, teachers, parents, and administrative staff through specialized role-based dashboards.',
      features: [
        'Role-Based Portals (Admin, Teacher, Student, Parent)',
        'Automated Daily Attendance with Biometric / QR Support',
        'Gradebook & Automated Report Card Generation (PDF)',
        'Integrated Tuition Billing & Receipt Generation',
        'Real-time Parent Notifications and Messaging',
      ],
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS', 'PDFKit'],
      screenshots: [
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=80',
      ],
      status: 'Live in Production',
      demoUrl: 'https://edunexus-demo.specialtech.com',
      githubUrl: 'https://github.com/specialtech/edunexus-core',
      isFeatured: true,
      isPublished: true,
    },
    {
      title: 'AuraMart - E-Commerce Platform',
      slug: 'auramart-ecommerce-platform',
      category: 'Web Applications',
      shortDesc: 'High-conversion multi-vendor marketplace with real-time stock sync, smart AI recommendations, and secure multi-currency payments.',
      description: 'AuraMart handles tens of thousands of daily SKU transactions with lightning speed. Designed with mobile-first checkout flows and dynamic inventory synchronization.',
      features: [
        'Sub-second Search with Instant Filtering and Faceting',
        'Multi-vendor Merchant Portal and Settlement Engine',
        'AI-Powered Product Recommendations Engine',
        'PCI-Compliant Stripe & PayPal Checkout Integration',
        'Automated Order Tracking and Fulfillment Pipelines',
      ],
      technologies: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Stripe API', 'Tailwind CSS'],
      screenshots: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
      ],
      status: 'Live in Production',
      demoUrl: 'https://auramart-demo.specialtech.com',
      githubUrl: 'https://github.com/specialtech/auramart-ecommerce',
      isFeatured: true,
      isPublished: true,
    },
    {
      title: 'CarePulse - Hospital & Clinic Management System',
      slug: 'carepulse-hospital-system',
      category: 'Custom Systems',
      shortDesc: 'HIPAA-compliant healthcare information system managing outpatient triage, EHR, pharmacy stock, and doctor appointments.',
      description: 'CarePulse unifies patient medical histories, clinical diagnostics, laboratory requests, and pharmacy inventory in a secured, encrypted portal with audit logs.',
      features: [
        'Electronic Health Record (EHR) & Diagnostics Tracking',
        'Doctor Shift Scheduling & Patient Queue Triage',
        'Integrated Pharmacy Stock & Prescription Management',
        'Laboratory Test Orders & Automated Result Dispatch',
        'HIPAA-Compliant Audit Logging and Data Encryption',
      ],
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS', 'Docker'],
      screenshots: [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80',
      ],
      status: 'Live in Production',
      demoUrl: 'https://carepulse-demo.specialtech.com',
      githubUrl: 'https://github.com/specialtech/carepulse-ehr',
      isFeatured: true,
      isPublished: true,
    },
    {
      title: 'RestoSync - Restaurant & POS Management',
      slug: 'restosync-restaurant-pos',
      category: 'Custom Systems',
      shortDesc: 'Touchscreen Point of Sale, kitchen display system (KDS), table reservation coordinator, and ingredient inventory tracker.',
      description: 'Built for high-volume restaurants and multi-branch food chains, RestoSync routes digital orders to kitchen displays in under 200ms while updating real-time recipe ingredient stocks.',
      features: [
        'Real-time Kitchen Display System (KDS) via WebSockets',
        'Interactive Table Layout and Seat Reservation Grid',
        'Split-Bill Payment Processing & Thermal Receipt Printing',
        'Automated Recipe-Level Ingredient Depletion',
      ],
      technologies: ['React', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'WebSockets'],
      screenshots: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      ],
      status: 'Live in Production',
      demoUrl: 'https://restosync-demo.specialtech.com',
      githubUrl: null,
      isFeatured: false,
      isPublished: true,
    },
    {
      title: 'ApexWallet - Personal Finance & Wealth Tracker',
      slug: 'apexwallet-finance-mobile',
      category: 'Mobile Applications',
      shortDesc: 'Mobile wealth tracking app with automated transaction categorizer, budget forecasting, and investment portfolio analytics.',
      description: 'ApexWallet brings institutional-grade financial analytics to everyday individuals with clean graphs, automatic expense categorization, and savings goal milestones.',
      features: [
        'Bank Feed Synchronization and Automatic Categorization',
        'Predictive Cash-flow & Budget Overflow Alerts',
        'Encrypted Biometric App Lock & Zero-Knowledge Architecture',
        'Interactive Net-Worth and Asset Distribution Charts',
      ],
      technologies: ['React Native', 'Expo', 'PostgreSQL', 'Prisma', 'Chart.js'],
      screenshots: [
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
      ],
      status: 'Live in Production',
      demoUrl: 'https://apexwallet-demo.specialtech.com',
      githubUrl: null,
      isFeatured: false,
      isPublished: true,
    },
    {
      title: 'VoyageCraft - AI Travel & Booking Engine',
      slug: 'voyagecraft-travel-booking',
      category: 'AI Projects',
      shortDesc: 'Intelligent itinerary builder and multi-hotel reservation platform that plans personalized journeys using generative AI.',
      description: 'VoyageCraft turns travel planning into an effortless conversation. Users describe their dream vacation, and the AI crafts a minute-by-minute itinerary with instant hotel and flight booking links.',
      features: [
        'Generative AI Itinerary Customizer based on budget and vibe',
        'Live Hotel Room Availability & Instant Booking Confirmation',
        'Interactive Map Route Explorer with Offline Cache',
        'Collaborative Group Itinerary Voting and Shared Split Expenses',
      ],
      technologies: ['React', 'Gemini AI API', 'Node.js', 'PostgreSQL', 'Mapbox GL'],
      screenshots: [
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      ],
      status: 'Live in Production',
      demoUrl: 'https://voyagecraft-demo.specialtech.com',
      githubUrl: 'https://github.com/specialtech/voyagecraft-ai',
      isFeatured: true,
      isPublished: true,
    },
  ];

  for (const p of projects) {
    await prisma.project.create({ data: p });
  }
  console.log(`✅ ${projects.length} Portfolio Projects seeded`);

  // 5. Admin Settings
  const settings = [
    { key: 'company_name', value: 'SPECIAL TECH', description: 'Official company name', isPublic: true },
    { key: 'company_tagline', value: 'Your Ideas. Our Technology. Intelligent Solutions.', description: 'Brand tagline', isPublic: true },
    { key: 'contact_email', value: 'contact@specialtech.com', description: 'Primary contact email', isPublic: true },
    { key: 'contact_phone', value: '+1 (555) 382-7000', description: 'Primary telephone number', isPublic: true },
    { key: 'contact_address', value: 'Silicon Horizon Tech Park, 400 Innovation Way, Suite 800', description: 'Physical office address', isPublic: true },
    { key: 'ai_provider', value: 'built-in', description: 'Default AI Provider (built-in, gemini, openai)', isPublic: false },
    { key: 'ai_model', value: 'gemini-1.5-flash', description: 'Default LLM Model Name', isPublic: false },
    { key: 'ai_temperature', value: '0.4', description: 'AI generation temperature parameter', isPublic: false },
    { key: 'ai_max_tokens', value: '3000', description: 'Maximum tokens per generation', isPublic: false },
  ];

  for (const s of settings) {
    await prisma.adminSetting.create({ data: s });
  }
  console.log(`✅ ${settings.length} Admin Settings seeded`);

  // 6. Sample Initial Customer & Completed AI Discovery Flow
  const sampleCustomer = await prisma.customer.create({
    data: {
      name: 'Dr. Arthur Pendelton',
      email: 'arthur.pendelton@horizonacademy.edu',
      phone: '+1 (555) 234-8901',
      company: 'Horizon Academic Academy',
      notes: 'Interested in replacing legacy desktop school software with EduNexus cloud suite.',
    },
  });

  const sampleConversation = await prisma.conversation.create({
    data: {
      customerId: sampleCustomer.id,
      sessionToken: 'sess_sample_edunexus_2026',
      title: 'School Management System Discovery',
      status: 'COMPLETED',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: sampleConversation.id,
        sender: MessageSender.ASSISTANT,
        content: `Hello! Welcome to Special Tech.\n\nHave an idea for a website, mobile app, or business management system?\n\nDon't worry if you don't know the technical details. Tell me what problem you want to solve, and I'll help you turn your idea into a clear software solution.`,
      },
      {
        conversationId: sampleConversation.id,
        sender: MessageSender.USER,
        content: `I want a comprehensive school management system for our high school and secondary academy. We struggle with attendance, grade reports, and fee collection.`,
      },
      {
        conversationId: sampleConversation.id,
        sender: MessageSender.ASSISTANT,
        content: `That sounds like an impactful project! Managing academic workflows digitally saves hundreds of hours for teachers. To tailor the system accurately: How many students and teachers do you expect to support, and do parents need their own mobile login to view grades and pay fees?`,
      },
      {
        conversationId: sampleConversation.id,
        sender: MessageSender.USER,
        content: `We have about 1,200 students and 75 staff members. Yes! Parents definitely need to log in to see report cards and pay tuition fees online.`,
      },
      {
        conversationId: sampleConversation.id,
        sender: MessageSender.ASSISTANT,
        content: `Excellent! I have compiled the complete system specification and prepared an interactive prototype for your school management system. You can explore the modules, test student admissions, attendance, and fee tracking right now!`,
      },
    ],
  });

  const sampleReq = await prisma.requirement.create({
    data: {
      conversationId: sampleConversation.id,
      projectName: 'Horizon Cloud Academy ERP',
      overview: 'A centralized cloud school management platform designed for secondary schools to streamline student records, biometric attendance, report cards, and online fee collection.',
      problemStatement: 'Disjointed paper records and manual spreadsheets leading to delayed grade reports, fee arrears, and lack of transparency with parents.',
      objectives: [
        'Digitize student lifecycle from admission to graduation',
        'Enable daily biometric and teacher attendance tracking in under 2 minutes',
        'Automate semester grade calculations and instant PDF report cards',
        'Provide a secure online payment portal for parents with instant receipts',
      ],
      targetUsers: ['School Administrators', 'Teachers', 'Students', 'Parents & Guardians', 'Bursar & Finance Staff'],
      userRoles: [
        { role: 'Super Admin', permissions: 'Full system control, staff management, financial audits' },
        { role: 'Teacher', permissions: 'Class attendance, grade entry, student performance remarks' },
        { role: 'Bursar', permissions: 'Fee structure management, invoice generation, reconciliation' },
        { role: 'Parent', permissions: 'View child grades, attendance history, online payment gateway' },
      ],
      functionalReqs: [
        'Student Information System (SIS) with profile pictures and medical notes',
        'Daily Class Attendance recording with automated SMS alerts for absent students',
        'Customizable Grading Scales with GPA & class rank computations',
        'Integrated Payment Gateway supporting debit cards, bank transfers, and receipts',
        'Exam Timetable and Room Assignment Generator',
      ],
      nonFunctionalReqs: [
        'Security: Role-based access control with AES-256 encrypted personal data',
        'Performance: Page load times under 800ms across 1,500 simultaneous users',
        'Availability: 99.9% uptime with automated nightly backups to cloud storage',
        'Responsiveness: Seamless operation on desktop, tablet, and mobile browsers',
      ],
      modules: [
        { name: 'Dashboard', desc: 'Executive overview with attendance rates, enrollment stats, and fee collection summaries' },
        { name: 'Student Management', desc: 'Directory, admission forms, class assignments, and student profiles' },
        { name: 'Teacher & Staff', desc: 'Staff directory, subject allocations, and teacher schedules' },
        { name: 'Attendance Tracker', desc: 'Daily roster checkboxes, historical trends, and exportable logs' },
        { name: 'Fee & Billing Portal', desc: 'Invoice tracking, pending dues list, and payment reconciliation' },
        { name: 'Examination & Reports', desc: 'Term report card generator with downloadable PDF transcripts' },
      ],
      recommendedTech: [
        { layer: 'Frontend', technology: 'React + Tailwind CSS for ultra-fast, responsive dashboards' },
        { layer: 'Backend', technology: 'Node.js Express RESTful API with modular service architecture' },
        { layer: 'Database', technology: 'PostgreSQL with Prisma ORM for relational integrity and strict ACID compliance' },
        { layer: 'Reporting', technology: 'PDFKit for automated server-side report card generation' },
      ],
      deliverables: [
        'Complete Source Code in Private Git Repository',
        'Interactive Web Application for Admin, Staff, and Parents',
        'PostgreSQL Database Schema & Migration Scripts',
        'Comprehensive User Documentation & Administrator Training Video',
        'Production Deployment to AWS / DigitalOcean with SSL Certificate',
      ],
      status: 'APPROVED',
      version: 1,
      approvedAt: new Date(),
    },
  });

  const samplePrototype = await prisma.prototype.create({
    data: {
      conversationId: sampleConversation.id,
      systemType: 'SCHOOL_MANAGEMENT',
      title: 'Horizon Cloud Academy Prototype',
      description: 'Interactive ERP prototype with active modules for students, attendance, fees, and analytics.',
      category: 'Education & ERP',
    },
  });

  const sampleVersion = await prisma.prototypeVersion.create({
    data: {
      prototypeId: samplePrototype.id,
      versionNumber: 1,
      changeNotes: 'Initial AI-generated interactive school prototype based on customer requirements.',
      configuration: {
        systemType: 'SCHOOL_MANAGEMENT',
        systemName: 'Horizon Cloud Academy',
        tagline: 'Intelligent Academic ERP & Student Management',
        primaryColor: '#087BFF',
        accentColor: '#08D9E8',
        modules: [
          { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
          { id: 'students', name: 'Students', icon: 'GraduationCap' },
          { id: 'teachers', name: 'Teachers', icon: 'Users' },
          { id: 'attendance', name: 'Attendance', icon: 'CalendarCheck' },
          { id: 'fees', name: 'Fee Management', icon: 'CreditCard' },
          { id: 'reports', name: 'Reports & Analytics', icon: 'BarChart3' },
        ],
        kpis: [
          { label: 'Total Enrolled Students', value: '1,248', change: '+12% this term', trend: 'up' },
          { label: 'Active Faculty Members', value: '78', change: 'Full capacity', trend: 'neutral' },
          { label: 'Today\'s Attendance Rate', value: '96.4%', change: '+1.8% vs last week', trend: 'up' },
          { label: 'Term Tuition Collected', value: '$482,500', change: '84% target reached', trend: 'up' },
        ],
      },
    },
  });

  await prisma.prototype.update({
    where: { id: samplePrototype.id },
    data: { currentVersionId: sampleVersion.id },
  });

  const sampleInquiry = await prisma.inquiry.create({
    data: {
      inquiryNumber: 'ST-INQ-2026-0001',
      customerId: sampleCustomer.id,
      title: 'Horizon Cloud Academy ERP Project Submission',
      message: 'We tested the interactive prototype generated by Special Tech AI and love the workflow. We are ready to proceed with implementation for the upcoming academic year.',
      status: InquiryStatus.NEW,
      priority: Priority.HIGH,
      budget: '$15,000 - $25,000',
      preferredContact: 'Email & Phone',
      requirementId: sampleReq.id,
      prototypeVersionId: sampleVersion.id,
      assignedToUserId: adminUser.id,
      internalNotes: 'Customer reviewed prototype; wants to schedule a formal architectural kickoff next Tuesday.',
    },
  });

  await prisma.notification.create({
    data: {
      title: 'New Project Submission Received',
      message: `Inquiry #${sampleInquiry.inquiryNumber} received from ${sampleCustomer.name} (${sampleCustomer.company}).`,
      type: 'inquiry',
      link: `/admin/inquiries/${sampleInquiry.id}`,
    },
  });

  // 8. Special Tech Company Products & Solutions
  const products = [
    {
      name: 'SpecialFlow AI',
      slug: 'specialflow-ai',
      category: 'AI & Automation',
      shortDesc: 'Autonomous multi-agent orchestration engine for complex business processes, document extraction, and real-time decision routing.',
      description: 'SpecialFlow AI bridges high-performance Large Language Models with deterministic business rules. Designed for mission-critical operations where reliability, strict SLA guardrails, and deterministic outcomes are mandatory.',
      logoUrl: '/logo/special-tech-icon.png',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      ],
      features: [
        'Multi-Agent Collaborative Task Execution',
        'Enterprise Vector Retrieval-Augmented Generation (RAG)',
        'Zero-Hallucination Guardrails & Confidence Scoring',
        'Bidirectional Webhook Integrations (Slack, CRM, ERP)',
      ],
      technologies: ['Node.js', 'Python', 'PostgreSQL', 'pgvector', 'Redis', 'Docker'],
      targetAudience: 'Enterprise IT leaders, Operations Executives, and High-Growth Fintechs',
      benefits: [
        'Reduces manual business process latency by up to 85%',
        'Full audit traceability of every AI decision path',
        'Deployable on-premise or cloud with zero vendor lock-in',
      ],
      docsUrl: 'https://docs.specialtech.com/specialflow',
      demoUrl: 'https://specialflow.demo.specialtech.com',
      howItWorks: '1. Connect data streams and document sources. 2. Define business goals and evaluation constraints. 3. Specialized AI agents execute tasks in parallel with human-in-the-loop approvals.',
      faqs: [
        { q: 'Can SpecialFlow AI run on our private VPC?', a: 'Yes, SpecialFlow AI supports full self-hosted Docker and Kubernetes deployments inside your AWS, Azure, or GCP private VPC.' },
        { q: 'How does it prevent AI hallucinations?', a: 'Every generated conclusion is cross-verified against your verified ground-truth documents using deterministic validation schemas.' },
      ],
      status: 'Published',
      isFeatured: true,
      isPublished: true,
      plans: [
        {
          name: 'Starter Cloud',
          price: 79.00,
          billingInterval: 'monthly',
          features: ['Up to 5 AI Agents', '50,000 monthly executions', 'Standard RAG pipeline', 'Email support'],
          isPopular: false,
        },
        {
          name: 'Professional Team',
          price: 249.00,
          billingInterval: 'monthly',
          features: ['Unlimited AI Agents', '500,000 monthly executions', 'Private Vector Database', 'Custom Model Fine-tuning', 'Priority 24/7 SLA Support'],
          isPopular: true,
        },
        {
          name: 'Enterprise Dedicated',
          price: 899.00,
          billingInterval: 'monthly',
          features: ['On-Premise / VPC Deployment', 'Unlimited Executions', 'Dedicated Solutions Architect', 'Custom Security Compliance (SOC2 / HIPAA)'],
          isPopular: false,
        },
      ],
    },
    {
      name: 'OmniPulse Cloud ERP',
      slug: 'omnipulse-cloud-erp',
      category: 'Enterprise SaaS',
      shortDesc: 'Modern cloud enterprise resource planning suite unifying multi-entity accounting, warehouse inventory, order fulfillment, and payroll.',
      description: 'OmniPulse replaces fragmented legacy systems with a single lightning-fast database architecture. Built specifically for medium-to-large distributors, manufacturing operations, and service organizations.',
      logoUrl: '/logo/special-tech-icon.png',
      coverImage: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      ],
      features: [
        'Real-Time Multi-Warehouse Stock & Lot Tracking',
        'Automated General Ledger & Double-Entry Accounting',
        'Multi-Currency Invoicing & Tax Compliance Engine',
        'Role-Based Granular Access Control & Security Auditing',
      ],
      technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS'],
      targetAudience: 'Growing enterprises, supply chain distributors, and multi-location businesses',
      benefits: [
        'Single source of truth eliminates inventory discrepancies',
        'Automates monthly accounting closing from weeks to hours',
        'Sub-second report generation across millions of transaction lines',
      ],
      docsUrl: 'https://docs.specialtech.com/omnipulse',
      demoUrl: 'https://omnipulse.demo.specialtech.com',
      howItWorks: '1. Import charts of accounts and inventory master catalogs. 2. Configure approval workflows and role permissions. 3. Manage purchase orders, sales transactions, and automated bank reconciliation.',
      faqs: [
        { q: 'Can OmniPulse integrate with our existing e-commerce storefronts?', a: 'Yes, OmniPulse features bi-directional REST and GraphQL APIs for Shopify, WooCommerce, and custom web applications.' },
      ],
      status: 'Published',
      isFeatured: true,
      isPublished: true,
      plans: [
        {
          name: 'Business',
          price: 149.00,
          billingInterval: 'monthly',
          features: ['Up to 15 Users', 'Single Organization', 'Core Accounting & Inventory', 'Automated Daily Backups'],
          isPopular: false,
        },
        {
          name: 'Enterprise Growth',
          price: 399.00,
          billingInterval: 'monthly',
          features: ['Unlimited Users', 'Multi-Entity & Multi-Currency', 'Advanced Warehouse Management', 'API Access & Webhooks', 'Dedicated Support Lead'],
          isPopular: true,
        },
      ],
    },
    {
      name: 'CyberGuard Vault',
      slug: 'cyberguard-vault',
      category: 'Security & DevOps',
      shortDesc: 'Zero-knowledge secrets manager, automated API credential rotation, and CI/CD security compliance auditing for engineering teams.',
      description: 'CyberGuard Vault protects your engineering infrastructure from credential leaks. Enforce automatic password and API key rotation, detect secrets committed to Git repositories, and maintain audit-ready compliance logs.',
      logoUrl: '/logo/special-tech-icon.png',
      coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
      ],
      features: [
        'Hardware-Backed AES-GCM 256-bit Encryption',
        'Automated Dynamic Credential & SSH Key Rotation',
        'Pre-Commit Git Hooks for Secret Detection',
        'SOC2 Type II & ISO27001 Compliance Reporting',
      ],
      technologies: ['Go', 'Node.js', 'PostgreSQL', 'Cryptography API', 'Docker'],
      targetAudience: 'DevOps engineers, CTOs, and compliance-driven development teams',
      benefits: [
        'Guaranteed zero secrets hardcoded in source code',
        'Instant emergency revocation across all cloud servers in 1 click',
        'Comprehensive audit log of every credential access',
      ],
      docsUrl: 'https://docs.specialtech.com/cyberguard',
      demoUrl: 'https://cyberguard.demo.specialtech.com',
      howItWorks: '1. Install the CLI or Kubernetes operator. 2. Define secret stores and rotation policies. 3. Applications receive short-lived credentials dynamically at runtime.',
      faqs: [
        { q: 'How is data encrypted?', a: 'Secrets are encrypted client-side using envelopes encrypted with AES-256-GCM before ever leaving your network.' },
      ],
      status: 'Published',
      isFeatured: false,
      isPublished: true,
      plans: [
        {
          name: 'Developer Free',
          price: 0.00,
          billingInterval: 'free',
          features: ['Up to 3 Users', '100 Secrets', 'CLI & GitHub Action integration', 'Community Support'],
          isPopular: false,
        },
        {
          name: 'Pro Security',
          price: 49.00,
          billingInterval: 'monthly',
          features: ['Up to 25 Users', 'Unlimited Secrets', 'Automated Credential Rotation', 'Audit Trail Export', 'Slack Alerts'],
          isPopular: true,
        },
      ],
    },
  ];

  for (const prodData of products) {
    const { plans, ...productInfo } = prodData;
    const createdProduct = await prisma.product.create({
      data: {
        ...productInfo,
        plans: {
          create: plans.map((p, idx) => ({
            name: p.name,
            price: p.price,
            billingInterval: p.billingInterval,
            features: p.features,
            isPopular: p.isPopular,
            sortOrder: idx,
          })),
        },
      },
    });

    console.log(`✅ Product created: ${createdProduct.name} with ${plans.length} plans`);
  }

  // 9. Sample Demo Request
  const specialFlowProduct = await prisma.product.findUnique({ where: { slug: 'specialflow-ai' } });
  if (specialFlowProduct) {
    await prisma.productDemoRequest.create({
      data: {
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@meridiancorp.com',
        phone: '+1 (555) 782-9901',
        company: 'Meridian Capital Partners',
        productId: specialFlowProduct.id,
        productName: specialFlowProduct.name,
        requirements: 'Interested in automating loan document risk analysis for our underwriting team. Expecting around 2,500 daily documents.',
        status: 'NEW',
        internalNotes: 'High-value enterprise lead. Prepare a customized mortgage document extraction demo.',
      },
    });
    console.log('✅ Sample Product Demo Request created');
  }

  console.log(`✅ Sample Customer, Conversation, Requirement, Prototype, Inquiry, Products, and Demo Requests created!`);
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

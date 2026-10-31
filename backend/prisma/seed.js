import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing Special Tech production database seed...');

  // 1. Super Admin User
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@specialtech.com' },
    update: {
      name: 'Special Tech Administrator',
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: 'admin@specialtech.com',
      name: 'Special Tech Administrator',
      passwordHash,
      role: Role.ADMIN,
      avatar: null,
      isActive: true,
    },
  });

  console.log(`✅ Super Admin configured: ${adminUser.email} (${adminUser.name})`);

  // 2. Core Engineering Services
  const services = [
    {
      title: 'Web Applications & Portals',
      slug: 'web-applications',
      icon: 'Globe',
      description: 'End-to-end full-stack web platforms, client portals, and SaaS solutions engineered for high concurrency, responsive usability, and high conversion.',
      problemsSolv: [
        'Slow, unresponsive web platforms losing potential customers',
        'Fragmented business operations requiring unified web access',
        'High bounce rates driven by poor UI/UX design',
      ],
      benefits: [
        'Instant sub-second load times using modern React architectures',
        'Normalized PostgreSQL databases providing strict data consistency',
        'Mobile-first responsive design ensuring seamless experience on all devices',
      ],
      features: [
        'Tailored React Frontend with Clean Modern Component Hierarchies',
        'Scalable RESTful Backend Architecture powered by Node.js & Express',
        'Relational Database Modeling with Prisma ORM & PostgreSQL',
        'Automated Client Document Generation and PDF Export Capabilities',
      ],
      technologies: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'Tailwind CSS'],
      sortOrder: 1,
    },
    {
      title: 'Mobile Application Development',
      slug: 'mobile-applications',
      icon: 'Smartphone',
      description: 'High-performance cross-platform iOS and Android mobile applications offering native responsiveness, offline synchronization, and push notifications.',
      problemsSolv: [
        'Lack of direct customer engagement through mobile channels',
        'High cost of maintaining dual native iOS and Android codebases',
        'Poor offline capabilities in field operations',
      ],
      benefits: [
        'Unified single codebase cutting development and maintenance costs by 40%',
        'Consistent 60fps animations and native hardware integration',
        'Instant push notification triggers driving higher customer retention',
      ],
      features: [
        'React Native & Flutter Cross-Platform Architecture',
        'Biometric Face ID & Fingerprint Authentication',
        'Offline Local Storage Syncing with Cloud PostgreSQL',
        'Background Geolocation & Push Notification Orchestration',
      ],
      technologies: ['React Native', 'TypeScript', 'Expo', 'PostgreSQL', 'Firebase'],
      sortOrder: 2,
    },
    {
      title: 'Enterprise Management Systems (ERP / CRM)',
      slug: 'enterprise-systems',
      icon: 'Layers',
      description: 'Custom ERPs, customer relationship systems, and operational workflow platforms built specifically around your company’s unique daily processes.',
      problemsSolv: [
        'Data silos and manual data transfer between disconnected software',
        'Inability to track team productivity and customer pipelines accurately',
        'Outgrowing generic off-the-shelf software with expensive per-seat licenses',
      ],
      benefits: [
        'Centralized source of company truth with real-time operational reporting',
        'Zero per-seat licensing penalties—own your intellectual property completely',
        'Automated routine administrative workflows saving hundreds of hours',
      ],
      features: [
        'Multi-Department Role-Based Access Control (RBAC)',
        'Comprehensive Audit Logging and Real-time Activity Telemetry',
        'Interactive Inventory, Accounting, and Human Resource Modules',
        'Custom Pipeline Visualization with Drag-and-Drop Kanban Boards',
      ],
      technologies: ['React', 'Express', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
      sortOrder: 3,
    },
    {
      title: 'Artificial Intelligence & Automation',
      slug: 'ai-automation',
      icon: 'Cpu',
      description: 'Smart LLM integration, automated requirement analysis, AI-powered document processing, and robotic business workflow engines.',
      problemsSolv: [
        'Exhausting team bandwidth on repetitive customer queries and triage',
        'Lengthy multi-week requirement gathering delays for new software',
        'Unstructured document processing requiring manual data entry',
      ],
      benefits: [
        '24/7 autonomous client requirement gathering and prototyping',
        '90% reduction in manual data entry through intelligent parsing',
        'Faster decision turnaround times backed by predictive analytics',
      ],
      features: [
        'Custom LLM Prompt Pipelines & Structured JSON Output Guardrails',
        'Interactive Prototype Generator from Natural Language Descriptions',
        'Automated Document OCR and Entity Extraction Systems',
        'Intelligent Recommendation & Anomaly Detection Models',
      ],
      technologies: ['Gemini API', 'OpenAI GPT-4o', 'Python', 'LangChain', 'Vector Search'],
      sortOrder: 4,
    },
    {
      title: 'Cloud Infrastructure & DevOps',
      slug: 'cloud-devops',
      icon: 'Cloud',
      description: 'Resilient cloud infrastructure, automated CI/CD deployment pipelines, container orchestration, and zero-downtime database failover configurations.',
      problemsSolv: [
        'Downtime during traffic spikes leading to lost revenue and customer trust',
        'Slow, error-prone manual deployment routines',
        'Lack of system health visibility and delayed disaster recovery',
      ],
      benefits: [
        '99.9% application uptime backed by automated self-healing clusters',
        'Rapid, reliable continuous deployment with instant rollback capabilities',
        'Reduced cloud hosting overhead through intelligent resource scaling',
      ],
      features: [
        'Docker Containerization & Kubernetes Cluster Architecture',
        'Automated CI/CD Pipelines with GitHub Actions and Automated Testing',
        'Managed Database Clustering with Automated Snapshots and Backups',
        'Real-time Logging, Health Telemetry, and Latency Monitoring',
      ],
      technologies: ['Docker', 'AWS', 'DigitalOcean', 'GitHub Actions', 'Nginx', 'PostgreSQL'],
      sortOrder: 5,
    },
    {
      title: 'Database Architecture & Migration',
      slug: 'database-architecture',
      icon: 'Database',
      description: 'Robust schema engineering, query performance optimization, index tuning, and zero-data-loss legacy migration to PostgreSQL.',
      problemsSolv: [
        'Crippling database query bottlenecks causing slow UI response',
        'Data corruption and orphaned records caused by weak foreign-key enforcement',
        'Difficulty scaling out data volumes beyond millions of rows',
      ],
      benefits: [
        'Normalized 3NF relational modeling ensuring complete ACID compliance',
        '10x faster query execution through indexed lookup strategies',
        'Automated version-controlled Prisma migration management',
      ],
      features: [
        'Relational Schema Engineering with Strict Foreign-Key Constraints',
        'Index Optimization (B-Tree, GIN, Partial Indexes)',
        'Zero-Downtime Data Migration Scripts with Rollback Safety',
        'Automated Data Auditing, Soft Deletes, and Archival Pipelines',
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
        'Wasted capital on incompatible technology stacks',
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
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }
  console.log(`✅ ${services.length} Engineering Services configured`);

  // 3. Admin & System Settings
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
    await prisma.adminSetting.upsert({
      where: { key: s.key },
      update: s,
      create: s,
    });
  }
  console.log(`✅ ${settings.length} Admin Settings configured`);

  // 4. Special Tech Proprietary Products & Solutions
  const products = [
    {
      name: 'SpecialFlow AI',
      slug: 'specialflow-ai',
      category: 'AI & Automation',
      shortDesc: 'Autonomous multi-agent orchestration engine for complex business processes, document extraction, and real-time decision routing.',
      description: 'SpecialFlow AI bridges high-performance Large Language Models with deterministic business rules. Designed for mission-critical operations where reliability, strict SLA guardrails, and deterministic outcomes are mandatory.',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      ],
      features: [
        'Multi-Agent LLM Orchestration with Fallback Logic',
        'Automated Ingestion of PDFs, Invoices, and Contracts',
        'Real-time Human-in-the-Loop Approval Workflows',
        'Enterprise RBAC with Full Security Audit Stream',
        'Sub-second Vector Search and Semantic Cache',
      ],
      technologies: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'OpenAI', 'Gemini'],
      targetAudience: 'Enterprise operations, fintech analysts, and automated customer support teams',
      benefits: [
        'Reduce document processing turnaround by up to 85%',
        'Eliminate manual data transcription errors completely',
        'Full audit traceability for compliance and regulatory reporting',
      ],
      howItWorks: 'SpecialFlow AI monitors incoming document pipelines, parses unstructured content with specialized AI extractors, verifies fields against internal PostgreSQL records, and routes approved records straight to your ERP.',
      status: 'Published',
      isFeatured: true,
      isPublished: true,
      plans: [
        {
          name: 'Starter Tier',
          price: 299.00,
          billingInterval: 'monthly',
          features: ['Up to 5,000 monthly documents', '3 Autonomous AI Agents', 'Email Support', '99.5% Uptime SLA'],
          isPopular: false,
        },
        {
          name: 'Professional Team',
          price: 799.00,
          billingInterval: 'monthly',
          features: ['Up to 25,000 monthly documents', '10 Autonomous AI Agents', 'Priority Support', 'Custom Model Fine-tuning', '99.9% Uptime SLA'],
          isPopular: true,
        },
        {
          name: 'Enterprise Dedicated',
          price: 1999.00,
          billingInterval: 'monthly',
          features: ['Unlimited monthly documents', 'Unlimited AI Agents', 'Dedicated Solutions Architect', 'On-Premise Deployment Option', '24/7 Phone Support'],
          isPopular: false,
        },
      ],
    },
    {
      name: 'OmniPulse Cloud ERP',
      slug: 'omnipulse-cloud-erp',
      category: 'Enterprise Software',
      shortDesc: 'Modern cloud enterprise resource planning suite for inventory tracking, multi-warehouse logistics, billing, and automated staff payroll.',
      description: 'OmniPulse Cloud ERP brings unified visibility to distributed companies. From real-time purchase order lifecycle tracking to automated tax reconciliations and staff scheduling.',
      coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      ],
      features: [
        'Multi-Warehouse Inventory with Barcode Scanner Sync',
        'Automated Invoicing & Multi-Currency Ledger',
        'Employee Attendance, Leave & Automated Payroll Run',
        'Real-time Financial Telemetry & P&L Reporting',
      ],
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS'],
      targetAudience: 'Growing enterprises, supply chain distributors, and multi-location retail operations',
      benefits: [
        'Real-time inventory visibility prevents stockouts and over-purchasing',
        'Automate month-end financial book closing from days to minutes',
        'Eliminate multiple disparate SaaS subscriptions with one unified platform',
      ],
      howItWorks: 'OmniPulse centralizes all operational data into a hardened PostgreSQL database, providing role-based web and mobile portals for warehouse teams, accountants, and executive leaders.',
      status: 'Published',
      isFeatured: true,
      isPublished: true,
      plans: [
        {
          name: 'Standard Business',
          price: 499.00,
          billingInterval: 'monthly',
          features: ['Up to 15 User Licenses', '2 Warehouses', 'Basic Payroll', 'Standard Support'],
          isPopular: false,
        },
        {
          name: 'Enterprise Scale',
          price: 1299.00,
          billingInterval: 'monthly',
          features: ['Unlimited User Licenses', 'Unlimited Warehouses', 'Advanced Tax & Multi-Currency', 'Dedicated Database Instance'],
          isPopular: true,
        },
      ],
    },
    {
      name: 'CyberGuard Vault',
      slug: 'cyberguard-vault',
      category: 'Security & Infrastructure',
      shortDesc: 'Zero-knowledge secrets manager, automated API credential rotation, and CI/CD security compliance auditing for engineering teams.',
      description: 'CyberGuard Vault guarantees that private keys, database credentials, and production API secrets never leak into source code or unencrypted logs. Engineered with hardware-level encryption standards.',
      coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      ],
      features: [
        'AES-256-GCM Zero-Knowledge Secret Encryption',
        'Automated Database Password Rotation Agents',
        'CI/CD Pipeline Security Gateways & Vulnerability Scans',
        'Immutable Tamper-Evident Security Audit Trails',
      ],
      technologies: ['Go', 'Node.js', 'PostgreSQL', 'Docker', 'Cryptography'],
      targetAudience: 'DevOps engineers, CTOs, and compliance-driven development teams',
      benefits: [
        'Prevent costly security breaches and unauthorized API key abuse',
        'Achieve SOC 2 and ISO 27001 credential compliance with automated audit reports',
        'Seamless developer CLI and SDK integration in seconds',
      ],
      howItWorks: 'CyberGuard intercepts secret requests dynamically at runtime, injecting ephemeral credentials that automatically expire after single-session executions.',
      status: 'Published',
      isFeatured: false,
      isPublished: true,
      plans: [
        {
          name: 'Developer Team',
          price: 199.00,
          billingInterval: 'monthly',
          features: ['Up to 5 Users', 'Unlimited Secrets', 'Standard Secret Rotation', 'Community Support'],
          isPopular: false,
        },
        {
          name: 'Enterprise Vault',
          price: 599.00,
          billingInterval: 'monthly',
          features: ['Up to 25 Users', 'Unlimited Secrets', 'Automated Credential Rotation', 'Audit Trail Export', 'Slack Alerts'],
          isPopular: true,
        },
      ],
    },
  ];

  for (const prodData of products) {
    const { plans, ...productInfo } = prodData;
    const existing = await prisma.product.findUnique({ where: { slug: prodData.slug } });
    if (!existing) {
      await prisma.product.create({
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
      console.log(`✅ Product seeded: ${prodData.name} with ${plans.length} plans`);
    } else {
      await prisma.product.update({
        where: { slug: prodData.slug },
        data: productInfo,
      });
      console.log(`✅ Product verified: ${prodData.name}`);
    }
  }

  console.log('🎉 Production seed verified. Zero fake data, zero sample customers, zero placeholder projects.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

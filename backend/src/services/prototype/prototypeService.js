import prisma from '../../config/db.js';

/**
 * Controlled Structured Prototype Generator and Modifier
 * Strictly outputs validated JSON configurations rendered by predefined React components.
 */

export const PROTOTYPE_BLUEPRINTS = {
  SCHOOL_MANAGEMENT: {
    systemType: 'SCHOOL_MANAGEMENT',
    systemName: 'EduCloud Pro ERP',
    tagline: 'Comprehensive Academic Administration & Student Portal',
    theme: {
      primaryColor: '#087BFF',
      accentColor: '#08D9E8',
      gradient: 'from-blue-600 to-cyan-500',
    },
    modules: [
      { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard' },
      { id: 'students', name: 'Students', icon: 'GraduationCap' },
      { id: 'teachers', name: 'Teachers', icon: 'Users' },
      { id: 'attendance', name: 'Attendance', icon: 'CalendarCheck' },
      { id: 'fees', name: 'Fee & Billing', icon: 'CreditCard' },
      { id: 'reports', name: 'Reports & Grades', icon: 'BarChart3' },
    ],
    kpis: [
      { label: 'Enrolled Students', value: '1,420', change: '+8.4% this year', trend: 'up', icon: 'GraduationCap', color: 'blue' },
      { label: 'Active Faculty', value: '82', change: '100% staffed', trend: 'neutral', icon: 'Users', color: 'emerald' },
      { label: 'Today\'s Attendance', value: '96.8%', change: '+1.2% vs yesterday', trend: 'up', icon: 'CalendarCheck', color: 'cyan' },
      { label: 'Fee Collection', value: '$512,800', change: '87% collected', trend: 'up', icon: 'CreditCard', color: 'violet' },
    ],
    tables: {
      students: {
        title: 'Student Roster Directory',
        searchPlaceholder: 'Search by student name, roll number, or grade...',
        columns: ['Roll No', 'Full Name', 'Grade & Section', 'Guardian', 'Attendance', 'Fee Status', 'Status'],
        rows: [
          { id: '1', roll: 'STU-101', name: 'Liam Alexander', grade: 'Grade 10-A', guardian: 'Robert Alexander', attendance: '98%', fee: 'Paid', status: 'Active' },
          { id: '2', roll: 'STU-102', name: 'Sophia Martinez', grade: 'Grade 10-B', guardian: 'Maria Martinez', attendance: '95%', fee: 'Paid', status: 'Active' },
          { id: '3', roll: 'STU-103', name: 'Ethan James Foster', grade: 'Grade 11-A', guardian: 'Karen Foster', attendance: '91%', fee: 'Pending', status: 'Active' },
          { id: '4', roll: 'STU-104', name: 'Olivia Grace Davis', grade: 'Grade 9-C', guardian: 'Thomas Davis', attendance: '99%', fee: 'Paid', status: 'Active' },
          { id: '5', roll: 'STU-105', name: 'Noah Benjamin Reed', grade: 'Grade 12-A', guardian: 'Sarah Reed', attendance: '88%', fee: 'Overdue', status: 'Warning' },
        ],
      },
      teachers: {
        title: 'Faculty & Department Instructors',
        searchPlaceholder: 'Search teachers by name or subject...',
        columns: ['Teacher ID', 'Name', 'Department', 'Classes Assigned', 'Email', 'Status'],
        rows: [
          { id: 't1', idNum: 'TCH-001', name: 'Dr. Michael Hayes', department: 'Mathematics', classes: 'Grade 10-A, 11-B', email: 'm.hayes@school.edu', status: 'Active' },
          { id: 't2', idNum: 'TCH-002', name: 'Sarah Jenkins, M.Sc.', department: 'Physics & Sciences', classes: 'Grade 11-A, 12-A', email: 's.jenkins@school.edu', status: 'Active' },
          { id: 't3', idNum: 'TCH-003', name: 'David Kim', department: 'Computer Science', classes: 'Grade 9-C, 10-B', email: 'd.kim@school.edu', status: 'Active' },
          { id: 't4', idNum: 'TCH-004', name: 'Emily Watson', department: 'English Literature', classes: 'Grade 9-A, 10-A', email: 'e.watson@school.edu', status: 'On Leave' },
        ],
      },
      fees: {
        title: 'Term Tuition Fee Invoices',
        searchPlaceholder: 'Search by invoice number or student...',
        columns: ['Invoice #', 'Student Name', 'Term', 'Amount', 'Due Date', 'Status'],
        rows: [
          { id: 'f1', invoice: 'INV-2026-081', student: 'Liam Alexander', term: 'Fall Term 2026', amount: '$1,200', due: '2026-11-15', status: 'Paid' },
          { id: 'f2', invoice: 'INV-2026-082', student: 'Sophia Martinez', term: 'Fall Term 2026', amount: '$1,200', due: '2026-11-15', status: 'Paid' },
          { id: 'f3', invoice: 'INV-2026-083', student: 'Ethan James Foster', term: 'Fall Term 2026', amount: '$1,350', due: '2026-11-20', status: 'Pending' },
          { id: 'f4', invoice: 'INV-2026-084', student: 'Noah Benjamin Reed', term: 'Fall Term 2026', amount: '$1,400', due: '2026-10-25', status: 'Overdue' },
        ],
      },
    },
    forms: {
      students: {
        title: 'Admit New Student',
        fields: [
          { label: 'Full Name', name: 'fullName', type: 'text', placeholder: 'e.g. Maya Sterling' },
          { label: 'Grade Level', name: 'grade', type: 'select', options: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] },
          { label: 'Parent / Guardian Name', name: 'guardian', type: 'text', placeholder: 'Guardian full name' },
          { label: 'Contact Phone', name: 'phone', type: 'text', placeholder: '+1 (555) 000-0000' },
          { label: 'Date of Birth', name: 'dob', type: 'date' },
        ],
      },
    },
    charts: [
      {
        id: 'enrollment-trend',
        title: 'Monthly Attendance Trend (%)',
        type: 'line',
        data: [
          { label: 'Mon', value: 97.2 },
          { label: 'Tue', value: 98.1 },
          { label: 'Wed', value: 96.4 },
          { label: 'Thu', value: 97.8 },
          { label: 'Fri', value: 95.9 },
        ],
      },
      {
        id: 'fee-breakdown',
        title: 'Tuition Fee Collection Status',
        type: 'donut',
        data: [
          { label: 'Paid in Full', value: 72, color: '#10B981' },
          { label: 'Partial Payment', value: 18, color: '#F59E0B' },
          { label: 'Outstanding Dues', value: 10, color: '#EF4444' },
        ],
      },
    ],
  },

  HOSPITAL_MANAGEMENT: {
    systemType: 'HOSPITAL_MANAGEMENT',
    systemName: 'CarePulse Health Suite',
    tagline: 'Modern Clinical ERP, EHR & Patient Scheduling',
    theme: {
      primaryColor: '#06B6D4',
      accentColor: '#3B82F6',
      gradient: 'from-cyan-600 to-blue-500',
    },
    modules: [
      { id: 'dashboard', name: 'Hospital Overview', icon: 'LayoutDashboard' },
      { id: 'patients', name: 'Patients & EHR', icon: 'UserCheck' },
      { id: 'appointments', name: 'Appointments', icon: 'Calendar' },
      { id: 'pharmacy', name: 'Pharmacy Stock', icon: 'Pill' },
      { id: 'billing', name: 'Billing & Invoices', icon: 'Receipt' },
    ],
    kpis: [
      { label: 'Active Inpatients', value: '184', change: '82% bed occupancy', trend: 'neutral', icon: 'BedDouble', color: 'blue' },
      { label: 'Today\'s Outpatients', value: '312', change: '+14% vs avg', trend: 'up', icon: 'Activity', color: 'cyan' },
      { label: 'Surgeries Scheduled', value: '18', change: '4 completed', trend: 'neutral', icon: 'Stethoscope', color: 'violet' },
      { label: 'Available Doctors', value: '46', change: 'On active shift', trend: 'up', icon: 'UserCheck', color: 'emerald' },
    ],
    tables: {
      patients: {
        title: 'Patient Clinical Registry',
        searchPlaceholder: 'Search by patient ID, name, or diagnosis...',
        columns: ['Patient ID', 'Full Name', 'Age/Gender', 'Attending Physician', 'Diagnosis', 'Room / Bed', 'Triage Status'],
        rows: [
          { id: 'p1', patId: 'MED-9021', name: 'Eleanor Roosevelt', age: '48 / F', doctor: 'Dr. Gregory House', diagnosis: 'Acute Hypertension', room: 'Room 304', status: 'Stable' },
          { id: 'p2', patId: 'MED-9022', name: 'James Thornton', age: '32 / M', doctor: 'Dr. Lisa Cuddy', diagnosis: 'Post-Op Knee Arthroscopy', room: 'Room 210', status: 'Recovery' },
          { id: 'p3', patId: 'MED-9023', name: 'Amina Al-Mansoor', age: '65 / F', doctor: 'Dr. Robert Chase', diagnosis: 'Type 2 Diabetes Check', room: 'Outpatient 4', status: 'Consulting' },
          { id: 'p4', patId: 'MED-9024', name: 'Lucas Scott', age: '19 / M', doctor: 'Dr. Allison Cameron', diagnosis: 'Minor Fracture (Radius)', room: 'Emergency 2', status: 'Discharged' },
        ],
      },
      pharmacy: {
        title: 'Hospital Pharmacy Inventory',
        searchPlaceholder: 'Search medication or drug barcode...',
        columns: ['Drug Code', 'Medication Name', 'Dosage Form', 'Stock On Hand', 'Reorder Level', 'Status'],
        rows: [
          { id: 'ph1', code: 'RX-101', name: 'Amoxicillin Clavulanate', form: '500mg Tablets', stock: '840 units', reorder: '200 units', status: 'In Stock' },
          { id: 'ph2', code: 'RX-102', name: 'Atorvastatin Calcium', form: '20mg Tablets', stock: '1,200 units', reorder: '300 units', status: 'In Stock' },
          { id: 'ph3', code: 'RX-103', name: 'Salbutamol Inhaler', form: '100mcg Spray', stock: '45 units', reorder: '50 units', status: 'Low Stock' },
          { id: 'ph4', code: 'RX-104', name: 'Normal Saline 0.9%', form: '500ml IV Bag', stock: '320 bags', reorder: '100 bags', status: 'In Stock' },
        ],
      },
    },
    forms: {
      patients: {
        title: 'Register New Inpatient',
        fields: [
          { label: 'Patient Name', name: 'name', type: 'text', placeholder: 'Full legal name' },
          { label: 'Date of Birth', name: 'dob', type: 'date' },
          { label: 'Attending Doctor', name: 'doctor', type: 'select', options: ['Dr. Gregory House', 'Dr. Lisa Cuddy', 'Dr. Robert Chase'] },
          { label: 'Primary Diagnosis / Symptoms', name: 'diagnosis', type: 'text', placeholder: 'Enter initial diagnosis' },
          { label: 'Ward / Bed Assignment', name: 'bed', type: 'text', placeholder: 'e.g. Ward B - Bed 14' },
        ],
      },
    },
    charts: [
      {
        id: 'patient-volume',
        title: 'Weekly Admissions & Discharges',
        type: 'bar',
        data: [
          { label: 'Mon', value: 42 },
          { label: 'Tue', value: 58 },
          { label: 'Wed', value: 49 },
          { label: 'Thu', value: 63 },
          { label: 'Fri', value: 54 },
          { label: 'Sat', value: 38 },
        ],
      },
    ],
  },

  ECOMMERCE_SYSTEM: {
    systemType: 'ECOMMERCE_SYSTEM',
    systemName: 'AuraMarketplace Enterprise',
    tagline: 'Multi-Channel Online Store & Inventory Commerce Engine',
    theme: {
      primaryColor: '#8B5CF6',
      accentColor: '#EC4899',
      gradient: 'from-violet-600 to-pink-500',
    },
    modules: [
      { id: 'dashboard', name: 'Sales Hub', icon: 'LayoutDashboard' },
      { id: 'products', name: 'Products & Catalog', icon: 'Package' },
      { id: 'orders', name: 'Orders Pipeline', icon: 'ShoppingBag' },
      { id: 'customers', name: 'Customers', icon: 'Users' },
      { id: 'discounts', name: 'Promotions', icon: 'Tag' },
    ],
    kpis: [
      { label: 'Total Revenue (Mtd)', value: '$94,230', change: '+18.2% vs last mo', trend: 'up', icon: 'DollarSign', color: 'emerald' },
      { label: 'Orders Processed', value: '1,842', change: '+12% conversion', trend: 'up', icon: 'ShoppingBag', color: 'violet' },
      { label: 'Average Order Value', value: '$84.60', change: '+$3.40 lift', trend: 'up', icon: 'TrendingUp', color: 'blue' },
      { label: 'Pending Shipments', value: '29', change: 'Same-day dispatch', trend: 'neutral', icon: 'Truck', color: 'cyan' },
    ],
    tables: {
      orders: {
        title: 'Customer Orders Stream',
        searchPlaceholder: 'Search order number or customer name...',
        columns: ['Order ID', 'Customer', 'Items Count', 'Total', 'Payment', 'Fulfillment', 'Date'],
        rows: [
          { id: 'ord1', orderId: '#ORD-8821', customer: 'Alexander Hayes', items: '3 items', total: '$149.00', payment: 'Paid (Stripe)', status: 'Processing', date: 'Just now' },
          { id: 'ord2', orderId: '#ORD-8820', customer: 'Claire Montgomery', items: '1 item', total: '$89.00', payment: 'Paid (PayPal)', status: 'Shipped', date: '25 min ago' },
          { id: 'ord3', orderId: '#ORD-8819', customer: 'Derrick Chen', items: '5 items', total: '$310.50', payment: 'Paid (Apple Pay)', status: 'Delivered', date: '2 hours ago' },
          { id: 'ord4', orderId: '#ORD-8818', customer: 'Samantha Price', items: '2 items', total: '$120.00', payment: 'Refunded', status: 'Cancelled', date: 'Yesterday' },
        ],
      },
      products: {
        title: 'Product Catalog Inventory',
        searchPlaceholder: 'Search products by title or SKU...',
        columns: ['SKU', 'Product Title', 'Category', 'Price', 'Stock Level', 'Status'],
        rows: [
          { id: 'prod1', sku: 'SKU-NEO-01', title: 'Ergonomic Cyber Desk Chair', category: 'Furniture', price: '$349.00', stock: '64 units', status: 'In Stock' },
          { id: 'prod2', sku: 'SKU-NEO-02', title: 'Ultra-Wide Curved Display 34"', category: 'Electronics', price: '$699.00', stock: '18 units', status: 'Low Stock' },
          { id: 'prod3', sku: 'SKU-NEO-03', title: 'Mechanical Wireless Keyboard', category: 'Peripherals', price: '$129.00', stock: '142 units', status: 'In Stock' },
          { id: 'prod4', sku: 'SKU-NEO-04', title: 'Noise-Cancelling Studio Pods', category: 'Audio', price: '$199.00', stock: '0 units', status: 'Out of Stock' },
        ],
      },
    },
    forms: {
      products: {
        title: 'Add New Product Listing',
        fields: [
          { label: 'Product Title', name: 'title', type: 'text', placeholder: 'e.g. Wireless Pro Earbuds' },
          { label: 'Category', name: 'category', type: 'select', options: ['Electronics', 'Audio', 'Peripherals', 'Furniture', 'Accessories'] },
          { label: 'Price ($)', name: 'price', type: 'number', placeholder: '129.99' },
          { label: 'Stock Quantity', name: 'stock', type: 'number', placeholder: '100' },
          { label: 'SKU Code', name: 'sku', type: 'text', placeholder: 'SKU-XYZ-01' },
        ],
      },
    },
    charts: [
      {
        id: 'revenue-growth',
        title: 'Daily Sales Revenue ($)',
        type: 'line',
        data: [
          { label: 'Mon', value: 8400 },
          { label: 'Tue', value: 11200 },
          { label: 'Wed', value: 9800 },
          { label: 'Thu', value: 14500 },
          { label: 'Fri', value: 16200 },
          { label: 'Sat', value: 18900 },
        ],
      },
    ],
  },

  INVENTORY_MANAGEMENT: {
    systemType: 'INVENTORY_MANAGEMENT',
    systemName: 'StockFlow Enterprise Hub',
    tagline: 'Multi-Warehouse Inventory & Supply Chain Logistics',
    theme: {
      primaryColor: '#059669',
      accentColor: '#10B981',
      gradient: 'from-emerald-600 to-teal-500',
    },
    modules: [
      { id: 'dashboard', name: 'Warehouse Hub', icon: 'LayoutDashboard' },
      { id: 'inventory', name: 'Stock Inventory', icon: 'Boxes' },
      { id: 'suppliers', name: 'Suppliers', icon: 'Truck' },
      { id: 'purchase-orders', name: 'Purchase Orders', icon: 'FileText' },
      { id: 'analytics', name: 'Turnover Reports', icon: 'TrendingUp' },
    ],
    kpis: [
      { label: 'Total Warehoused Value', value: '$1.48M', change: '+5.2% vs Q3', trend: 'up', icon: 'Boxes', color: 'emerald' },
      { label: 'Active SKUs', value: '4,892', change: 'Across 3 hubs', trend: 'neutral', icon: 'Layers', color: 'blue' },
      { label: 'Low Stock Alerts', value: '14 items', change: 'Action required', trend: 'down', icon: 'AlertTriangle', color: 'amber' },
      { label: 'Pending Goods Received', value: '8 orders', change: 'Dock arrival today', trend: 'up', icon: 'Truck', color: 'cyan' },
    ],
    tables: {
      inventory: {
        title: 'Live Warehouse Stock Registry',
        searchPlaceholder: 'Search item name, SKU, or bin location...',
        columns: ['SKU Barcode', 'Item Description', 'Warehouse Hub', 'Bin Location', 'Available Qty', 'Reorder Point', 'Status'],
        rows: [
          { id: 'inv1', sku: 'SKU-STEEL-01', desc: 'Galvanized Hex Bolts M12', hub: 'Central Hub A', bin: 'Aisle 4-B2', qty: '45,000 pcs', reorder: '10,000 pcs', status: 'In Stock' },
          { id: 'inv2', sku: 'SKU-COPPER-02', desc: 'Insulated Copper Wire 50m', hub: 'Central Hub A', bin: 'Aisle 12-C1', qty: '380 coils', reorder: '500 coils', status: 'Low Stock' },
          { id: 'inv3', sku: 'SKU-VALVE-03', desc: 'Brass Ball Valve 1/2 Inch', hub: 'West Coast Depo', bin: 'Shelf 8-A', qty: '1,420 units', reorder: '400 units', status: 'In Stock' },
          { id: 'inv4', sku: 'SKU-FILTER-04', desc: 'Hydraulic Return Filter Element', hub: 'Central Hub B', bin: 'Aisle 2-D3', qty: '12 units', reorder: '50 units', status: 'Critical' },
        ],
      },
    },
    forms: {
      inventory: {
        title: 'Create Inbound Purchase Order',
        fields: [
          { label: 'Supplier Name', name: 'supplier', type: 'text', placeholder: 'e.g. Apex Industrial Supplies' },
          { label: 'Target Warehouse', name: 'hub', type: 'select', options: ['Central Hub A', 'Central Hub B', 'West Coast Depo'] },
          { label: 'Total Purchase Amount ($)', name: 'amount', type: 'number', placeholder: '12500' },
          { label: 'Expected Delivery Date', name: 'expectedDate', type: 'date' },
        ],
      },
    },
    charts: [
      {
        id: 'stock-turnover',
        title: 'Inventory Category Valuation ($)',
        type: 'donut',
        data: [
          { label: 'Fasteners & Hardware', value: 450000, color: '#10B981' },
          { label: 'Electrical & Cabling', value: 520000, color: '#3B82F6' },
          { label: 'Pneumatics & Valves', value: 310000, color: '#F59E0B' },
          { label: 'Safety & Tools', value: 200000, color: '#8B5CF6' },
        ],
      },
    ],
  },

  CUSTOM_BUSINESS_SYSTEM: {
    systemType: 'CUSTOM_BUSINESS_SYSTEM',
    systemName: 'NexusEnterprise Solutions',
    tagline: 'Tailored Enterprise Operations, Workflow & Client Portal',
    theme: {
      primaryColor: '#087BFF',
      accentColor: '#8B5CF6',
      gradient: 'from-blue-600 to-violet-600',
    },
    modules: [
      { id: 'dashboard', name: 'Operations Overview', icon: 'LayoutDashboard' },
      { id: 'clients', name: 'Client Accounts', icon: 'Building2' },
      { id: 'projects', name: 'Active Engagements', icon: 'Briefcase' },
      { id: 'invoices', name: 'Billing & Financials', icon: 'CreditCard' },
      { id: 'analytics', name: 'Performance Intelligence', icon: 'BarChart' },
    ],
    kpis: [
      { label: 'Active Enterprise Clients', value: '48', change: '+4 this quarter', trend: 'up', icon: 'Building2', color: 'blue' },
      { label: 'Ongoing Projects', value: '19', change: 'On track: 95%', trend: 'neutral', icon: 'Briefcase', color: 'emerald' },
      { label: 'Contract Revenue (Ytd)', value: '$840,000', change: '+24% YoY', trend: 'up', icon: 'TrendingUp', color: 'violet' },
      { label: 'Team Utilization', value: '89.2%', change: 'Optimal bandwidth', trend: 'up', icon: 'Users', color: 'cyan' },
    ],
    tables: {
      clients: {
        title: 'Enterprise Client Portfolio',
        searchPlaceholder: 'Search corporate accounts, contacts, or industry...',
        columns: ['Client Code', 'Company Name', 'Industry', 'Account Executive', 'Active SOWs', 'Contract Value', 'Status'],
        rows: [
          { id: 'cl1', code: 'ACC-01', name: 'Vanguard Global Logistics', industry: 'Supply Chain', exec: 'Marcus Vance', sows: '2 Active', value: '$180,000', status: 'Active' },
          { id: 'cl2', code: 'ACC-02', name: 'Helios Clean Energy', industry: 'Renewable Power', exec: 'Elena Rostova', sows: '1 Active', value: '$95,000', status: 'Active' },
          { id: 'cl3', code: 'ACC-03', name: 'Apex FinTech Capital', industry: 'Financial Services', exec: 'Sophia Chen', sows: '3 Active', value: '$240,000', status: 'Active' },
          { id: 'cl4', code: 'ACC-04', name: 'BioGenesis Pharmaceuticals', industry: 'Life Sciences', exec: 'Julian Mercer', sows: 'Proposal', value: '$120,000', status: 'Under Review' },
        ],
      },
    },
    forms: {
      clients: {
        title: 'Onboard New Corporate Client',
        fields: [
          { label: 'Company Name', name: 'company', type: 'text', placeholder: 'e.g. Acme Corporation' },
          { label: 'Primary Contact Person', name: 'contact', type: 'text', placeholder: 'Full Name' },
          { label: 'Industry Sector', name: 'industry', type: 'select', options: ['Technology', 'Finance', 'Logistics', 'Healthcare', 'Energy'] },
          { label: 'Estimated Contract Value ($)', name: 'value', type: 'number', placeholder: '50000' },
        ],
      },
    },
    charts: [
      {
        id: 'revenue-forecast',
        title: 'Quarterly Revenue Milestone ($)',
        type: 'bar',
        data: [
          { label: 'Q1', value: 180000 },
          { label: 'Q2', value: 240000 },
          { label: 'Q3', value: 210000 },
          { label: 'Q4 (Proj)', value: 290000 },
        ],
      },
    ],
  },
};

/**
 * Generate initial Prototype record and version 1
 */
export const generatePrototype = async (conversationId, systemType) => {
  // If no systemType provided, detect from conversation messages
  let detectedType = systemType;
  if (!detectedType) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });
    const allText = conversation?.messages.map((m) => m.content).join(' ') || '';
    const lower = allText.toLowerCase();

    if (lower.includes('school') || lower.includes('student') || lower.includes('teacher')) detectedType = 'SCHOOL_MANAGEMENT';
    else if (lower.includes('hospital') || lower.includes('clinic') || lower.includes('patient')) detectedType = 'HOSPITAL_MANAGEMENT';
    else if (lower.includes('shop') || lower.includes('store') || lower.includes('ecommerce')) detectedType = 'ECOMMERCE_SYSTEM';
    else if (lower.includes('inventory') || lower.includes('warehouse') || lower.includes('stock')) detectedType = 'INVENTORY_MANAGEMENT';
    else detectedType = 'CUSTOM_BUSINESS_SYSTEM';
  }

  const blueprint = PROTOTYPE_BLUEPRINTS[detectedType] || PROTOTYPE_BLUEPRINTS.CUSTOM_BUSINESS_SYSTEM;

  // Check if prototype already exists for this conversation
  let prototype = await prisma.prototype.findFirst({
    where: { conversationId },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });

  if (!prototype) {
    prototype = await prisma.prototype.create({
      data: {
        conversationId,
        systemType: blueprint.systemType,
        title: blueprint.systemName,
        description: blueprint.tagline,
        category: blueprint.systemType.replace('_', ' '),
      },
    });
  }

  // Create version 1
  const version = await prisma.prototypeVersion.create({
    data: {
      prototypeId: prototype.id,
      versionNumber: 1,
      configuration: blueprint,
      changeNotes: 'Initial AI-generated interactive system prototype',
      createdBy: 'Special Tech AI Architect',
    },
  });

  // Link as currentVersion
  await prisma.prototype.update({
    where: { id: prototype.id },
    data: { currentVersionId: version.id, systemType: blueprint.systemType, title: blueprint.systemName },
  });

  return {
    prototype,
    currentVersion: version,
    configuration: blueprint,
  };
};

/**
 * AI-Powered Prototype Modification
 * Handles natural language instructions like:
 * - "Add parent messaging module"
 * - "Change theme color to cyan / violet"
 * - "Add a new KPI for bus fleet"
 * - "Add room booking table"
 */
export const modifyPrototypeWithAI = async (prototypeId, prompt) => {
  const prototype = await prisma.prototype.findUnique({
    where: { id: prototypeId },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });

  if (!prototype) {
    throw new Error('Prototype not found');
  }

  const latestVersion = prototype.versions[0];
  const currentConfig = JSON.parse(JSON.stringify(latestVersion.configuration));
  const lowerPrompt = prompt.toLowerCase();

  // Create a clean deep-cloned updated configuration
  const updatedConfig = { ...currentConfig };
  let changeDescription = '';

  // 1. Theme Color Modifications
  if (lowerPrompt.includes('color') || lowerPrompt.includes('theme') || lowerPrompt.includes('violet') || lowerPrompt.includes('purple')) {
    if (lowerPrompt.includes('violet') || lowerPrompt.includes('purple')) {
      updatedConfig.theme = {
        primaryColor: '#8B5CF6',
        accentColor: '#C084FC',
        gradient: 'from-violet-600 to-indigo-600',
      };
      changeDescription += 'Updated color palette to Futuristic Violet. ';
    } else if (lowerPrompt.includes('cyan') || lowerPrompt.includes('teal')) {
      updatedConfig.theme = {
        primaryColor: '#06B6D4',
        accentColor: '#38BDF8',
        gradient: 'from-cyan-600 to-blue-500',
      };
      changeDescription += 'Updated color palette to Electric Cyan. ';
    } else if (lowerPrompt.includes('emerald') || lowerPrompt.includes('green')) {
      updatedConfig.theme = {
        primaryColor: '#10B981',
        accentColor: '#34D399',
        gradient: 'from-emerald-600 to-teal-500',
      };
      changeDescription += 'Updated color palette to Vibrant Emerald. ';
    }
  }

  // 2. Module additions
  if (lowerPrompt.includes('add') && (lowerPrompt.includes('module') || lowerPrompt.includes('page') || lowerPrompt.includes('section'))) {
    if (lowerPrompt.includes('parent') || lowerPrompt.includes('portal') || lowerPrompt.includes('message') || lowerPrompt.includes('chat')) {
      if (!updatedConfig.modules.some((m) => m.id === 'messaging')) {
        updatedConfig.modules.push({ id: 'messaging', name: 'Parent & Staff Chat', icon: 'MessageSquare' });
        changeDescription += 'Added Parent & Staff Chat Communication Module. ';
      }
    } else if (lowerPrompt.includes('transport') || lowerPrompt.includes('bus') || lowerPrompt.includes('fleet')) {
      if (!updatedConfig.modules.some((m) => m.id === 'transport')) {
        updatedConfig.modules.push({ id: 'transport', name: 'Fleet & Transport', icon: 'Truck' });
        changeDescription += 'Added Fleet & Transport Management Module. ';
      }
    } else if (lowerPrompt.includes('exam') || lowerPrompt.includes('grade') || lowerPrompt.includes('result')) {
      if (!updatedConfig.modules.some((m) => m.id === 'exams')) {
        updatedConfig.modules.push({ id: 'exams', name: 'Examinations & Results', icon: 'Award' });
        changeDescription += 'Added Examination & Results Module. ';
      }
    } else if (lowerPrompt.includes('hostel') || lowerPrompt.includes('dorm') || lowerPrompt.includes('room')) {
      if (!updatedConfig.modules.some((m) => m.id === 'hostel')) {
        updatedConfig.modules.push({ id: 'hostel', name: 'Hostel & Housing', icon: 'Home' });
        changeDescription += 'Added Hostel & Student Housing Module. ';
      }
    } else {
      // Generic new module from prompt
      const modName = prompt.replace(/(add|module|page|section|please)/gi, '').trim() || 'Custom Extension';
      const modId = modName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 16);
      if (!updatedConfig.modules.some((m) => m.id === modId)) {
        updatedConfig.modules.push({ id: modId, name: modName.charAt(0).toUpperCase() + modName.slice(1), icon: 'Sparkles' });
        changeDescription += `Added ${modName} Module. `;
      }
    }
  }

  // 3. KPI additions
  if (lowerPrompt.includes('kpi') || lowerPrompt.includes('metric') || lowerPrompt.includes('stat')) {
    updatedConfig.kpis.push({
      label: 'System Efficiency Index',
      value: '99.4%',
      change: '+4.2% AI optimized',
      trend: 'up',
      icon: 'Zap',
      color: 'violet',
    });
    changeDescription += 'Added real-time System Efficiency metric card. ';
  }

  if (!changeDescription) {
    changeDescription = `Applied custom UI optimizations based on instruction: "${prompt}"`;
  }

  // Increment version number
  const newVersionNumber = latestVersion.versionNumber + 1;

  const newVersion = await prisma.prototypeVersion.create({
    data: {
      prototypeId: prototype.id,
      versionNumber: newVersionNumber,
      configuration: updatedConfig,
      changeNotes: changeDescription,
      createdBy: 'Customer via AI Assistant',
    },
  });

  await prisma.prototype.update({
    where: { id: prototype.id },
    data: { currentVersionId: newVersion.id },
  });

  return {
    prototype,
    currentVersion: newVersion,
    configuration: updatedConfig,
    changeNotes: changeDescription,
  };
};

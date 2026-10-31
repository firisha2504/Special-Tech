import prisma from '../../config/db.js';

/**
 * Special Tech AI Engine & Software Business Analyst System
 * Provides multi-provider support:
 * 1. 'built-in': Special Tech intelligent heuristic NLP business analyst
 * 2. 'gemini': Google Gemini API (gemini-1.5-flash / gemini-1.5-pro / gemini-2.0-flash)
 * 3. 'openai': OpenAI API (gpt-4o / gpt-4o-mini)
 */

// Domain classification heuristics
export const SYSTEM_PATTERNS = [
  {
    type: 'SCHOOL_MANAGEMENT',
    keywords: ['school', 'student', 'teacher', 'attendance', 'grade', 'class', 'college', 'university', 'curriculum', 'exam', 'tuition'],
    defaultName: 'EduCloud Pro - School Management System',
  },
  {
    type: 'HOSPITAL_MANAGEMENT',
    keywords: ['hospital', 'clinic', 'doctor', 'patient', 'medical', 'prescription', 'pharmacy', 'health', 'appointment', 'ehr', 'clinical'],
    defaultName: 'Healthcare & Clinic Management System (EHR)',
  },
  {
    type: 'ECOMMERCE_SYSTEM',
    keywords: ['ecommerce', 'e-commerce', 'shop', 'store', 'cart', 'product', 'order', 'payment', 'checkout', 'vendor', 'sell', 'marketplace'],
    defaultName: 'OmniTrade - Modern E-Commerce Platform',
  },
  {
    type: 'INVENTORY_MANAGEMENT',
    keywords: ['inventory', 'warehouse', 'stock', 'supplier', 'supply chain', 'sku', 'barcode', 'procurement', 'logistics', 'reorder'],
    defaultName: 'ApexStock - Enterprise Inventory & Warehouse System',
  },
  {
    type: 'HOTEL_MANAGEMENT',
    keywords: ['hotel', 'resort', 'room', 'booking', 'guest', 'reservation', 'check-in', 'amenity', 'reception', 'hospitality'],
    defaultName: 'GrandHorizon Hospitality & Room Reservation Suite',
  },
  {
    type: 'EMPLOYEE_MANAGEMENT',
    keywords: ['employee', 'hr', 'payroll', 'human resources', 'leave', 'performance', 'recruitment', 'timesheet', 'staff', 'salary', 'workforce'],
    defaultName: 'PulseHR Workforce & Automated Payroll Platform',
  },
  {
    type: 'ELEARNING_PLATFORM',
    keywords: ['elearning', 'e-learning', 'course', 'lms', 'learning', 'quiz', 'lesson', 'lecture', 'student progress', 'certificate', 'tutor', 'curriculum', 'online learning'],
    defaultName: 'EduStream - Interactive E-Learning & Course Platform',
  },
  {
    type: 'FOOTBALL_TOURNAMENT',
    keywords: ['football', 'soccer', 'tournament', 'league', 'match', 'fixture', 'team', 'player', 'referee', 'championship', 'standings', 'goal', 'bracket', 'pitch'],
    defaultName: 'KickOff Tournament & League Championship Manager',
  },
  {
    type: 'RESTAURANT_MANAGEMENT',
    keywords: ['restaurant', 'food', 'table', 'menu', 'kitchen', 'order', 'pos', 'dining', 'chef', 'cafe', 'delivery'],
    defaultName: 'RestoPro Dining & Kitchen Display POS System',
  },
];

export const detectSystemType = (text = '') => {
  const lower = text.toLowerCase();
  for (const pattern of SYSTEM_PATTERNS) {
    if (
      pattern.keywords.some((kw) => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
      })
    ) {
      return pattern;
    }
  }
  return {
    type: 'CUSTOM_BUSINESS_SYSTEM',
    keywords: [],
    defaultName: 'NexusEnterprise - Custom Business Management Platform',
  };
};

/**
 * Persist AI diagnostic status safely to admin settings
 */
export const recordDiagnostic = async (provider, status, errorMsg = null) => {
  try {
    await prisma.adminSetting.upsert({
      where: { key: 'ai_last_status' },
      update: { value: status },
      create: { key: 'ai_last_status', value: status },
    });
    if (status === 'operational' || status === 'connected') {
      const nowStr = new Date().toISOString();
      await prisma.adminSetting.upsert({
        where: { key: 'ai_last_connected_at' },
        update: { value: nowStr },
        create: { key: 'ai_last_connected_at', value: nowStr },
      });
      await prisma.adminSetting.upsert({
        where: { key: 'ai_last_error' },
        update: { value: '' },
        create: { key: 'ai_last_error', value: '' },
      });
    } else if (errorMsg) {
      await prisma.adminSetting.upsert({
        where: { key: 'ai_last_error' },
        update: { value: String(errorMsg).slice(0, 500) },
        create: { key: 'ai_last_error', value: String(errorMsg).slice(0, 500) },
      });
    }
  } catch (err) {
    // Non-critical, ignore
  }
};

/**
 * Retrieve current active AI configuration safely (without exposing secrets)
 */
export const getAIConfig = async () => {
  try {
    const [
      providerSetting,
      modelSetting,
      geminiKeySetting,
      openaiKeySetting,
      lastStatusSetting,
      lastConnectedSetting,
      lastErrorSetting,
    ] = await Promise.all([
      prisma.adminSetting.findUnique({ where: { key: 'ai_provider' } }),
      prisma.adminSetting.findUnique({ where: { key: 'ai_model' } }),
      prisma.adminSetting.findUnique({ where: { key: 'gemini_api_key' } }),
      prisma.adminSetting.findUnique({ where: { key: 'openai_api_key' } }),
      prisma.adminSetting.findUnique({ where: { key: 'ai_last_status' } }),
      prisma.adminSetting.findUnique({ where: { key: 'ai_last_connected_at' } }),
      prisma.adminSetting.findUnique({ where: { key: 'ai_last_error' } }),
    ]);

    const provider = providerSetting?.value || process.env.AI_PROVIDER || 'built-in';
    const model = modelSetting?.value || process.env.AI_MODEL || (provider === 'openai' ? 'gpt-4o' : 'gemini-1.5-flash');
    const geminiApiKey = process.env.GEMINI_API_KEY || geminiKeySetting?.value || null;
    const openaiApiKey = process.env.OPENAI_API_KEY || openaiKeySetting?.value || null;

    const hasGeminiKey = !!(geminiApiKey && geminiApiKey.trim());
    const hasOpenaiKey = !!(openaiApiKey && openaiApiKey.trim());
    const hasExternalCredentials = (provider === 'gemini' && hasGeminiKey) || (provider === 'openai' && hasOpenaiKey);

    return {
      provider,
      model,
      hasGeminiKey,
      hasOpenaiKey,
      hasExternalCredentials,
      geminiApiKey: geminiApiKey?.trim() || null,
      openaiApiKey: openaiApiKey?.trim() || null,
      lastStatus: lastStatusSetting?.value || (provider === 'built-in' ? 'operational' : 'not_verified'),
      lastConnectedAt: lastConnectedSetting?.value || null,
      lastError: lastErrorSetting?.value || null,
    };
  } catch (err) {
    console.error('Failed to read AI configuration:', err.message);
    return {
      provider: 'built-in',
      model: 'gemini-1.5-flash',
      hasGeminiKey: false,
      hasOpenaiKey: false,
      hasExternalCredentials: false,
      geminiApiKey: null,
      openaiApiKey: null,
      lastStatus: 'operational',
      lastConnectedAt: null,
      lastError: null,
    };
  }
};

/**
 * Test AI Service Connection Live
 */
export const testAIConnection = async () => {
  const config = await getAIConfig();
  const startTime = Date.now();

  if (config.provider === 'built-in') {
    const latencyMs = Date.now() - startTime;
    await recordDiagnostic('built-in', 'operational', null);
    return {
      success: true,
      provider: 'built-in',
      model: 'Special Tech Intelligent Business Analyst (Heuristic NLP)',
      status: 'operational',
      latencyMs,
      message: 'Special Tech built-in software business analyst engine is active and operational.',
      capabilities: [
        'Domain Classification & Heuristic Intent Parsing (8 Enterprise Systems)',
        'Progressive Requirements Gathering & Multi-turn Conversational Context',
        'Structured Technical Specification Blueprint Generator',
        'Interactive JSON Visual Prototype Synthesis',
      ],
    };
  }

  if (config.provider === 'gemini') {
    if (!config.geminiApiKey) {
      const err = 'Gemini API Key is not configured. Set GEMINI_API_KEY in .env or via Admin Dashboard Settings.';
      await recordDiagnostic('gemini', 'misconfigured', err);
      return {
        success: false,
        provider: 'gemini',
        model: config.model,
        status: 'misconfigured',
        error: err,
      };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'Respond with exactly: "SPECIAL_TECH_AI_ONLINE"' }],
              },
            ],
          }),
        }
      );

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson.error?.message || `Gemini API returned status ${response.status}`;
        await recordDiagnostic('gemini', 'error', errMsg);
        return {
          success: false,
          provider: 'gemini',
          model: config.model,
          status: 'error',
          httpStatus: response.status,
          latencyMs,
          error: errMsg,
        };
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      await recordDiagnostic('gemini', 'connected', null);
      return {
        success: true,
        provider: 'gemini',
        model: config.model,
        status: 'connected',
        latencyMs,
        message: 'Google Gemini API connected and verified successfully.',
        sampleResponse: reply.slice(0, 50),
      };
    } catch (err) {
      const errMsg = err.name === 'TimeoutError' ? 'Gemini API connection timed out after 10s.' : err.message;
      await recordDiagnostic('gemini', 'unreachable', errMsg);
      return {
        success: false,
        provider: 'gemini',
        model: config.model,
        status: 'unreachable',
        error: errMsg,
      };
    }
  }

  if (config.provider === 'openai') {
    if (!config.openaiApiKey) {
      const err = 'OpenAI API Key is not configured. Set OPENAI_API_KEY in .env or via Admin Dashboard Settings.';
      await recordDiagnostic('openai', 'misconfigured', err);
      return {
        success: false,
        provider: 'openai',
        model: config.model,
        status: 'misconfigured',
        error: err,
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'Respond with exactly: "SPECIAL_TECH_AI_ONLINE"' }],
          max_tokens: 15,
        }),
      });

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson.error?.message || `OpenAI API returned status ${response.status}`;
        await recordDiagnostic('openai', 'error', errMsg);
        return {
          success: false,
          provider: 'openai',
          model: config.model,
          status: 'error',
          httpStatus: response.status,
          latencyMs,
          error: errMsg,
        };
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || '';
      await recordDiagnostic('openai', 'connected', null);
      return {
        success: true,
        provider: 'openai',
        model: config.model,
        status: 'connected',
        latencyMs,
        message: 'OpenAI API connected and verified successfully.',
        sampleResponse: reply.slice(0, 50),
      };
    } catch (err) {
      const errMsg = err.name === 'TimeoutError' ? 'OpenAI API connection timed out after 10s.' : err.message;
      await recordDiagnostic('openai', 'unreachable', errMsg);
      return {
        success: false,
        provider: 'openai',
        model: config.model,
        status: 'unreachable',
        error: errMsg,
      };
    }
  }

  return {
    success: false,
    provider: config.provider,
    status: 'unsupported',
    error: `Unsupported AI provider: "${config.provider}". Supported: built-in, gemini, openai.`,
  };
};

/**
 * Internal Built-In Software Business Analyst Logic
 */
export const generateBuiltInAnalystResponse = (conversation, userMessage) => {
  const allConversationText = (
    conversation.messages.map((m) => m.content).join(' ') + ' ' + userMessage
  ).toLowerCase();
  const lowerMsg = userMessage.toLowerCase();
  const sysInfo = detectSystemType(allConversationText);
  const userTurns = Math.max(1, conversation.messages.filter((m) => m.sender === 'USER').length);

  // On the first turn (initial idea pitch), prioritize domain-specific discovery
  if (userTurns <= 1) {
    if (sysInfo.type === 'SCHOOL_MANAGEMENT') {
      return `That is a high-impact software project! A school management system brings tremendous efficiency to administration, instructors, and parents.\n\nTo tailor the right architecture: What level of institution is this for (K-12, secondary school, or college/university)? And roughly how many students and faculty members will use it?`;
    } else if (sysInfo.type === 'HOSPITAL_MANAGEMENT') {
      return `Healthcare software is one of our primary specialties! A digital clinic or hospital suite reduces patient wait times and eliminates record errors.\n\nFirst, is this for a specialized private clinic, a multi-specialty hospital, or a diagnostic center? And do you need integrated pharmacy dispensation and medical billing?`;
    } else if (sysInfo.type === 'ELEARNING_PLATFORM') {
      return `Online learning and digital education empower instructors and learners worldwide!\n\nTo tailor the right platform architecture: Will your courses feature pre-recorded on-demand video lectures, live virtual classrooms, or corporate compliance modules? And roughly how many active learners do you anticipate?`;
    } else if (sysInfo.type === 'HOTEL_MANAGEMENT') {
      return `Hospitality operations demand flawless guest satisfaction and instant room turnaround!\n\nTo shape your system: Is this for a single boutique property, a resort hotel, or a chain of properties? And do you require online direct booking with payment gateway integration, plus housekeeping status synchronization?`;
    } else if (sysInfo.type === 'EMPLOYEE_MANAGEMENT') {
      return `A modern HR and workforce platform eliminates payroll errors and empowers employees!\n\nTo tailor the system: How many full-time and contract employees does your company support? And do you require multi-tiered leave approvals, automated tax and payroll calculation, and biometric or GPS clock-in?`;
    } else if (sysInfo.type === 'FOOTBALL_TOURNAMENT') {
      return `A football championship and tournament system delivers real-time thrills and flawless scheduling to clubs and supporters!\n\nTo design your platform: Is this for a single knockout cup tournament, an ongoing multi-division league, or youth academy festivals? And do you need live match score commentary, player statistics (goals/cards), and official referee reporting?`;
    } else if (sysInfo.type === 'ECOMMERCE_SYSTEM') {
      return `An e-commerce platform is a great revenue driver! Building custom allows you to avoid high marketplace fees.\n\nWill this be a direct single-brand store for your own inventory, or a multi-vendor marketplace where external merchants can register and sell their items?`;
    } else if (sysInfo.type === 'INVENTORY_MANAGEMENT') {
      return `Optimizing inventory flow directly cuts operational overhead and stock shortages.\n\nDoes your business manage a single physical warehouse or multiple retail branches? And do you need barcode/QR scanning and automatic low-stock purchase orders?`;
    } else {
      return `That sounds like a high-impact digital project! We specialize in turning unique business concepts into robust software.\n\nTo shape the right software blueprint: Who are your primary target users, and what is the biggest manual headache or bottleneck this system will eliminate for them?`;
    }
  }

  // Specific Follow-up Topic Analysis for Subsequent Turns
  // A. Technology Stack inquiries
  if (lowerMsg.includes('tech stack') || lowerMsg.includes('technology') || lowerMsg.includes('database') || lowerMsg.includes('language') || lowerMsg.includes('framework')) {
    return `For ${sysInfo.defaultName}, we recommend a modern, robust architectural stack:\n\n• **Frontend**: React with Tailwind CSS for high responsiveness and fluid sub-second interaction.\n• **Backend API**: Node.js & Express RESTful microservices for high throughput.\n• **Database**: PostgreSQL with Prisma ORM for strict ACID compliance, data integrity, and fast relational indexing.\n• **Deployment**: Docker containerization with automated CI/CD and automated nightly cloud backups.\n\nDoes your team have any existing software, cloud infrastructure, or third-party APIs that this system will need to connect with?`;
  }

  // B. Security & Compliance inquiries
  if (lowerMsg.includes('security') || lowerMsg.includes('safe') || lowerMsg.includes('encrypt') || lowerMsg.includes('privacy') || lowerMsg.includes('protect')) {
    return `Security is engineered into the foundation of every Special Tech build:\n\n1. **Data Protection**: AES-256 encryption at rest and strict TLS 1.3 in transit.\n2. **Access Control**: Granular Role-Based Access Control (RBAC) ensuring users only see what their role permits.\n3. **Authentication**: Bcrypt password hashing with timed JWT token expiration.\n4. **Audit Logging**: Immutable timestamped activity logs for all critical system actions.\n\nAre there any specific industry regulations (like HIPAA, PCI-DSS for credit cards, or GDPR) your project must adhere to?`;
  }

  // C. Timeline & Budget inquiries
  if (lowerMsg.includes('how long') || lowerMsg.includes('timeline') || lowerMsg.includes('cost') || lowerMsg.includes('price') || lowerMsg.includes('budget') || lowerMsg.includes('quote')) {
    return `Our agile delivery model typically follows 4 structured phases:\n\n1. **Discovery & Specification (Week 1)**: Requirements finalization and clickable visual prototype.\n2. **Architecture & Database Setup (Weeks 2-3)**: Core schema engineering and secure API foundation.\n3. **Feature Sprints (Weeks 4-6)**: Frontend portals, business logic, integrations, and automated tests.\n4. **QA & Cloud Launch (Weeks 7-8)**: Security audit, staging review, and production deployment.\n\nMost custom implementations in this category fall in the $15,000 to $45,000 range based on scope. Would you like to review our generated interactive prototype next?`;
  }

  // D. Specific Feature Additions (Mobile apps, payment gateways, biometric, notifications)
  if (/\b(mobile|ios|android)\b/i.test(lowerMsg) || /\bapps?\b/i.test(lowerMsg)) {
    return `Adding mobile access is a smart strategic move! We can engineer a responsive cross-platform React Native mobile application that connects seamlessly to your centralized PostgreSQL database, supporting push notifications, biometric login, and offline syncing.\n\nWould the mobile app be used primarily by end-users (like customers or parents/patients) or by internal operational staff on the floor?`;
  }

  if (/\b(payment|payments|fee|fees|billing|stripe|invoice|invoices)\b/i.test(lowerMsg)) {
    return `Automated payment handling will save your finance team dozens of hours every month! We can integrate direct payment gateways (like Stripe, PayPal, or local bank direct transfer) with automated invoice generation, digital receipts, and real-time reconciliation logs.\n\nDo you need one-time checkout payments, recurring monthly/annual subscriptions, or automated scheduled fee reminders?`;
  }

  // Progressive Discovery Questions based on Subsequent Conversation Turns
  if (userTurns <= 2) {
    return `That gives us crystal-clear direction! Based on your workflow, we can design role-tailored dashboards so every user has an intuitive, distraction-free experience.\n\nNext, what specific user roles should have access (for example: Administrator, Staff, Customers, and Managers)? And are there specific mobile capabilities or instant SMS/Email notifications needed?`;
  } else if (userTurns <= 3) {
    return `Understood! Having distinct user roles with strict permissions ensures your data remains secure while giving each team member the exact tools they need.\n\nAre there any specific third-party tools, payment processors (like Stripe), or legacy databases you need this platform to integrate with?`;
  } else {
    return `Excellent! We now have comprehensive clarity on your requirements.\n\nI have synthesized your specifications into a structured Project Blueprint and generated an interactive, clickable Prototype.\n\nYou can click on the **Specification** and **Prototype** tabs above to inspect the modules, test interactions, and submit your project to our engineering team whenever you are ready!`;
  }
};

/**
 * Generate AI Business Analyst Response with Multi-Provider Transparency & Fallback
 */
export const generateAIResponse = async (conversation, userMessage) => {
  const config = await getAIConfig();
  const systemPrompt = `You are the Senior Software Business Analyst for SPECIAL TECH, an elite AI-powered custom software engineering company.
Your goal is to guide prospective clients who have software ideas, help them define requirements, target users, modules, and architecture in plain, accessible, non-intimidating language.
Always maintain full conversational context.
Ask 1 or 2 targeted, clarifying questions at a time based on the user's specific answers.
Explain technical concepts in simple terms.
Never invent fictional clients or claims.`;

  // 1. Google Gemini Provider
  if (config.provider === 'gemini') {
    if (!config.geminiApiKey) {
      const fallbackReason = 'Google Gemini API Key is not configured in .env or Admin Settings.';
      await recordDiagnostic('gemini', 'misconfigured', fallbackReason);
      const builtInReply = generateBuiltInAnalystResponse(conversation, userMessage);
      const formatted = `[Special Tech Business Analyst — Operating in Fallback Mode: Google Gemini API Key is not configured]\n\n${builtInReply}`;
      const payload = new String(formatted);
      payload.content = formatted;
      payload.metadata = {
        provider: 'built-in',
        configuredProvider: 'gemini',
        model: 'Special Tech Intelligent Business Analyst (Heuristic NLP)',
        isFallback: true,
        fallbackReason,
      };
      return payload;
    }

    try {
      const contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
      ];

      for (const m of conversation.messages) {
        contents.push({
          role: m.sender === 'USER' ? 'user' : 'model',
          parts: [{ text: m.content }],
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({ contents }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText && aiText.trim()) {
          await recordDiagnostic('gemini', 'connected', null);
          const payload = new String(aiText.trim());
          payload.content = aiText.trim();
          payload.metadata = {
            provider: 'gemini',
            configuredProvider: 'gemini',
            model: config.model,
            isFallback: false,
            fallbackReason: null,
          };
          return payload;
        }
      }

      // External API error: fall back transparently without crashing backend
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `Google Gemini API returned status ${response.status}`;
      await recordDiagnostic('gemini', 'error', errMsg);
      const builtInReply = generateBuiltInAnalystResponse(conversation, userMessage);
      const formatted = `[Special Tech Business Analyst — Operating in Fallback Mode: Google Gemini error (${errMsg})]\n\n${builtInReply}`;
      const payload = new String(formatted);
      payload.content = formatted;
      payload.metadata = {
        provider: 'built-in',
        configuredProvider: 'gemini',
        model: 'Special Tech Intelligent Business Analyst (Heuristic NLP)',
        isFallback: true,
        fallbackReason: `Google Gemini error: ${errMsg}`,
      };
      return payload;
    } catch (err) {
      const errMsg = err.name === 'TimeoutError' ? 'Google Gemini request timed out after 15s.' : err.message;
      await recordDiagnostic('gemini', 'unreachable', errMsg);
      const builtInReply = generateBuiltInAnalystResponse(conversation, userMessage);
      const formatted = `[Special Tech Business Analyst — Operating in Fallback Mode: Google Gemini connection failed (${errMsg})]\n\n${builtInReply}`;
      const payload = new String(formatted);
      payload.content = formatted;
      payload.metadata = {
        provider: 'built-in',
        configuredProvider: 'gemini',
        model: 'Special Tech Intelligent Business Analyst (Heuristic NLP)',
        isFallback: true,
        fallbackReason: errMsg,
      };
      return payload;
    }
  }

  // 2. OpenAI Provider
  if (config.provider === 'openai') {
    if (!config.openaiApiKey) {
      const fallbackReason = 'OpenAI API Key is not configured in .env or Admin Settings.';
      await recordDiagnostic('openai', 'misconfigured', fallbackReason);
      const builtInReply = generateBuiltInAnalystResponse(conversation, userMessage);
      const formatted = `[Special Tech Business Analyst — Operating in Fallback Mode: OpenAI API Key is not configured]\n\n${builtInReply}`;
      const payload = new String(formatted);
      payload.content = formatted;
      payload.metadata = {
        provider: 'built-in',
        configuredProvider: 'openai',
        model: 'Special Tech Intelligent Business Analyst (Heuristic NLP)',
        isFallback: true,
        fallbackReason,
      };
      return payload;
    }

    try {
      const messages = [{ role: 'system', content: systemPrompt }];

      for (const m of conversation.messages) {
        messages.push({
          role: m.sender === 'USER' ? 'user' : 'assistant',
          content: m.content,
        });
      }

      messages.push({ role: 'user', content: userMessage });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: 0.4,
          max_tokens: 1500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content;
        if (aiText && aiText.trim()) {
          await recordDiagnostic('openai', 'connected', null);
          const payload = new String(aiText.trim());
          payload.content = aiText.trim();
          payload.metadata = {
            provider: 'openai',
            configuredProvider: 'openai',
            model: config.model,
            isFallback: false,
            fallbackReason: null,
          };
          return payload;
        }
      }

      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `OpenAI API returned status ${response.status}`;
      await recordDiagnostic('openai', 'error', errMsg);
      const builtInReply = generateBuiltInAnalystResponse(conversation, userMessage);
      const formatted = `[Special Tech Business Analyst — Operating in Fallback Mode: OpenAI error (${errMsg})]\n\n${builtInReply}`;
      const payload = new String(formatted);
      payload.content = formatted;
      payload.metadata = {
        provider: 'built-in',
        configuredProvider: 'openai',
        model: 'Special Tech Intelligent Business Analyst (Heuristic NLP)',
        isFallback: true,
        fallbackReason: `OpenAI error: ${errMsg}`,
      };
      return payload;
    } catch (err) {
      const errMsg = err.name === 'TimeoutError' ? 'OpenAI request timed out after 15s.' : err.message;
      await recordDiagnostic('openai', 'unreachable', errMsg);
      const builtInReply = generateBuiltInAnalystResponse(conversation, userMessage);
      const formatted = `[Special Tech Business Analyst — Operating in Fallback Mode: OpenAI connection failed (${errMsg})]\n\n${builtInReply}`;
      const payload = new String(formatted);
      payload.content = formatted;
      payload.metadata = {
        provider: 'built-in',
        configuredProvider: 'openai',
        model: 'Special Tech Intelligent Business Analyst (Heuristic NLP)',
        isFallback: true,
        fallbackReason: errMsg,
      };
      return payload;
    }
  }

  // 3. Special Tech Built-in Software Business Analyst Engine
  const builtInReply = generateBuiltInAnalystResponse(conversation, userMessage);
  const payload = new String(builtInReply);
  payload.content = builtInReply;
  payload.metadata = {
    provider: 'built-in',
    configuredProvider: 'built-in',
    model: 'Special Tech Intelligent Business Analyst (Heuristic NLP)',
    isFallback: false,
    fallbackReason: null,
  };
  return payload;
};

/**
 * Generate Structured Project Specification (Requirement model)
 */
export const generateProjectSpecification = async (conversation) => {
  const allText = conversation.messages.map((m) => m.content).join(' ');
  const detected = detectSystemType(allText);

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
      name: 'Healthcare & Clinic Management System (EHR)',
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
    ELEARNING_PLATFORM: {
      name: 'EduStream - Interactive E-Learning & Course Platform',
      overview: 'A scalable LMS platform providing structured on-demand video courses, interactive quizzes, student progress analytics, and automated certificate generation.',
      problemStatement: 'Fragmented online learning tools, lack of student completion tracking, and difficult course monetization.',
      objectives: [
        'Deliver responsive, video-rich course modules accessible across all devices',
        'Automate quiz evaluation, grade tracking, and PDF certificate issuance upon course completion',
        'Support multi-instructor publishing and automated revenue split payouts',
        'Keep students engaged with lesson notes, progress bars, and discussion threads',
      ],
      targetUsers: ['Course Instructors', 'Students / Learners', 'Platform Admins', 'Corporate Training Managers'],
      userRoles: [
        { role: 'Course Instructor', permissions: 'Upload video lectures, create quizzes, view student marks' },
        { role: 'Student / Learner', permissions: 'Enroll in courses, stream lessons, take exams, download certificates' },
        { role: 'Platform Admin', permissions: 'Approve courses, manage instructor payouts, oversee platform analytics' },
      ],
      functionalReqs: [
        'Video Lecture Streaming with lesson checklist and playback speed controls',
        'Interactive Quiz Engine with immediate scoring and retry policies',
        'Automated PDF Completion Certificate Generator with unique verification ID',
        'Course Marketplace with Stripe/PayPal one-time and subscription checkout',
        'Student Discussion Forum & Q&A per lesson',
      ],
      nonFunctionalReqs: [
        'Streaming Speed: Fast CDN-backed adaptive bitrate video streaming',
        'Scalability: Support thousands of simultaneous video streaming learners',
        'Security: Encrypted video URLs preventing unauthorized hotlinking',
      ],
      modules: [
        { name: 'Learner Dashboard', desc: 'Enrolled courses, overall completion %, and continuing lessons' },
        { name: 'Course Catalog', desc: 'Category browsing, instructor bios, curriculum syllabus, and reviews' },
        { name: 'Video Classroom', desc: 'Distraction-free video player with lesson notes and resources' },
        { name: 'Quizzes & Grades', desc: 'Interactive assessments, timer controls, and question banks' },
        { name: 'Certificates', desc: 'Issued PDF credentials with shareable verification links' },
      ],
      recommendedTech: [
        { layer: 'Frontend', technology: 'React + Tailwind CSS with Video.js player integration' },
        { layer: 'Backend', technology: 'Node.js Express REST API with Stripe Webhooks' },
        { layer: 'Database', technology: 'PostgreSQL with Prisma ORM for relational course hierarchy' },
        { layer: 'Storage', technology: 'Cloud Object Storage (S3 / Cloudflare R2) for video assets' },
      ],
      deliverables: [
        'Complete E-Learning Web Application Suite (Portal & Admin)',
        'PostgreSQL Database Schema & Migration files',
        'Certificate PDF Generation Service',
        'Cloud Deployment Configuration & 6 Months SLA Maintenance',
      ],
    },
    HOTEL_MANAGEMENT: {
      name: 'GrandHorizon Hospitality & Room Reservation Suite',
      overview: 'A full-service hospitality management platform engineered to automate room bookings, guest folios, housekeeping room inspection, and amenities billing.',
      problemStatement: 'Double bookings, manual reservation sheets, delayed housekeeping turnaround, and disorganized guest invoicing.',
      objectives: [
        'Provide an interactive calendar grid of room availability and live reservations',
        'Streamline guest check-in, check-out, deposit collection, and key allocation',
        'Synchronize housekeeping room cleaning status in real time between front desk and maids',
        'Deliver transparent itemized folio billing for restaurant, spa, and room charges',
      ],
      targetUsers: ['Hotel General Managers', 'Front Desk Staff', 'Housekeeping Supervisors', 'Guests'],
      userRoles: [
        { role: 'Front Desk Agent', permissions: 'Create reservations, check-in guests, assign rooms, print folios' },
        { role: 'Housekeeping Lead', permissions: 'Update room cleaning status (Clean / Dirty / Maintenance)' },
        { role: 'Hotel Manager', permissions: 'Room pricing, seasonal rate adjustments, occupancy reporting' },
        { role: 'Guest Portal', permissions: 'View booking confirmation, request room service, review bill' },
      ],
      functionalReqs: [
        'Visual Room Reservation Calendar with drag-and-drop booking management',
        'Guest Folio Billing unifying room charges, restaurant tabs, and city taxes',
        'Housekeeping Operations Dashboard with real-time room readiness status',
        'Online Booking Engine with credit card deposit authorization',
        'Guest Profile Directory retaining VIP preferences and loyalty stays',
      ],
      nonFunctionalReqs: [
        'Reliability: 99.99% uptime to prevent booking interruptions at reception',
        'Performance: Real-time room status updates via lightweight REST polling',
        'Security: PCI-DSS tokenized storage for guest credit cards',
      ],
      modules: [
        { name: 'Front Desk Dashboard', desc: 'Today\'s arrivals, departures, VIP alerts, and occupancy rate' },
        { name: 'Room Inventory', desc: 'Category pricing (Deluxe, Suite, Standard), amenities, and floor plans' },
        { name: 'Reservations Calendar', desc: 'Timeline view of bookings, guest names, and confirmation codes' },
        { name: 'Housekeeping', desc: 'Room cleaning assignments, inspection approvals, and supply status' },
        { name: 'Billing & Folios', desc: 'Itemized charges, payment reconciliations, and tax invoices' },
      ],
      recommendedTech: [
        { layer: 'Frontend', technology: 'React + Tailwind CSS with responsive full-screen booking calendar' },
        { layer: 'Backend', technology: 'Node.js Express with Prisma transaction safety' },
        { layer: 'Database', technology: 'PostgreSQL for relational room availability indexing' },
      ],
      deliverables: [
        'Hotel Management Web Application (Front Desk & Housekeeping views)',
        'Guest Booking Engine Portal',
        'PostgreSQL Database Architecture & Migrations',
        'Production Cloud Setup with Daily Automated Backups',
      ],
    },
    EMPLOYEE_MANAGEMENT: {
      name: 'PulseHR Workforce & Automated Payroll Platform',
      overview: 'An enterprise human resource and payroll management suite designed to automate employee records, monthly salary runs, paid leave approvals, and appraisal tracking.',
      problemStatement: 'Manual spreadsheets for payroll causing tax errors, untracked employee sick leaves, and lack of performance visibility.',
      objectives: [
        'Maintain a single source of truth for all employee profiles, contracts, and departments',
        'Automate salary calculations with deductions, allowances, and tax withholding',
        'Streamline employee leave requests with multi-level manager approval workflows',
        'Track daily attendance, shift rosters, and employee performance milestones',
      ],
      targetUsers: ['HR Directors', 'Department Managers', 'Payroll Officers', 'Employees / Staff'],
      userRoles: [
        { role: 'HR Administrator', permissions: 'Employee onboarding, contract management, company policies' },
        { role: 'Payroll Specialist', permissions: 'Run monthly payroll batches, generate payslips, tax reports' },
        { role: 'Department Manager', permissions: 'Approve leave requests, review employee attendance and KPIs' },
        { role: 'Employee', permissions: 'View payslips, request PTO / sick leaves, submit expense claims' },
      ],
      functionalReqs: [
        'Employee Directory with role designations, compensation details, and documents',
        'Automated Payroll Processing with 1-click payslip generation in PDF format',
        'Leave Management Portal with automated balance calculations (PTO, sick leave)',
        'Daily Attendance & Shift Roster tracking with overtime calculations',
        'Annual Performance Review and Milestone Goal Tracker',
      ],
      nonFunctionalReqs: [
        'Confidentiality: Strict encryption and role isolation for sensitive compensation data',
        'Auditability: Complete timestamped audit trail of all payroll edits and approvals',
        'Compliance: Adherence to statutory labor regulations and tax computation rules',
      ],
      modules: [
        { name: 'HR Dashboard', desc: 'Headcount metrics, upcoming leaves, payroll run status, and attrition' },
        { name: 'Employee Directory', desc: 'Staff profiles, emergency contacts, job descriptions, and salary info' },
        { name: 'Payroll & Compensation', desc: 'Monthly payroll batch generator, deductions, bonuses, and tax reports' },
        { name: 'Leave & PTO', desc: 'Request submission form, manager approval queue, and calendar' },
        { name: 'Attendance & Shifts', desc: 'Clock-in log, hours worked, overtime approvals, and shift schedules' },
      ],
      recommendedTech: [
        { layer: 'Frontend', technology: 'React + Tailwind CSS with accessible forms and data tables' },
        { layer: 'Backend', technology: 'Node.js Express REST microservices with bcrypt & JWT auth' },
        { layer: 'Database', technology: 'PostgreSQL with Prisma ORM for strict relational integrity' },
        { layer: 'Export Engine', technology: 'PDFKit for automated payslip rendering' },
      ],
      deliverables: [
        'HR Management Web Application & Employee Self-Service Portal',
        'Automated Payslip PDF Generator Service',
        'PostgreSQL Database Architecture & Migration Scripts',
        'Cloud Deployment with SSL and Automated Nightly Backups',
      ],
    },
    FOOTBALL_TOURNAMENT: {
      name: 'KickOff Tournament & League Championship Manager',
      overview: 'A digital sports administration and championship platform engineered to manage football leagues, team rosters, match fixture schedules, live scores, and automated standings tables.',
      problemStatement: 'Manual scorekeeping, disorganized tournament brackets, delayed league table updates, and lack of real-time fan visibility.',
      objectives: [
        'Automate tournament fixture generation across league, knockout, and group stages',
        'Record match events (goals, yellow/red cards, substitutions) with instant live score updates',
        'Calculate league standings automatically based on wins, draws, goal difference, and head-to-head',
        'Provide official match referee reporting and disciplinary suspension tracking',
      ],
      targetUsers: ['Tournament Directors', 'Team Managers / Coaches', 'Referees / Match Officials', 'Football Fans & Supporters'],
      userRoles: [
        { role: 'Tournament Director', permissions: 'Create leagues, generate fixtures, assign pitches, manage rules' },
        { role: 'Team Coach / Manager', permissions: 'Register squad players, submit starting line-ups, verify match stats' },
        { role: 'Referee / Official', permissions: 'Enter live match score, log card cautions, sign off match reports' },
        { role: 'Public Fan', permissions: 'View live scores, inspect standings tables, check top goal scorers' },
      ],
      functionalReqs: [
        'Tournament & League Builder (Group Stage, Round Robin, Single/Double Knockout)',
        'Automated Fixture Generator with venue and kickoff time slot scheduling',
        'Match Center with live score clock, goal scorers, assists, and disciplinary cards',
        'Automated Standings Table updated immediately upon match completion',
        'Player Statistics Leaderboard tracking top goal scorers, assists, and clean sheets',
      ],
      nonFunctionalReqs: [
        'Real-time Performance: Low-latency score updates accessible by hundreds of mobile viewers',
        'Mobile Responsiveness: Mobile-first match center layout for spectators and referees at pitchside',
        'Data Integrity: Referee digital sign-off preventing post-match score tampering',
      ],
      modules: [
        { name: 'Tournament Dashboard', desc: 'Active championships, today\'s matches, goals scored, and card count' },
        { name: 'Teams & Squads', desc: 'Registered clubs, player rosters, squad numbers, and coaching staff' },
        { name: 'Fixtures & Matches', desc: 'Upcoming games, kickoff schedules, pitch assignments, and live score center' },
        { name: 'League Standings', desc: 'Automated points table (Played, Won, Drawn, Lost, GF, GA, GD, PTS)' },
        { name: 'Player Leaderboards', desc: 'Golden Boot top scorers, assists leaders, and fair play rankings' },
      ],
      recommendedTech: [
        { layer: 'Frontend', technology: 'React, Tailwind CSS, Lucide Sports Icons with mobile-first UI' },
        { layer: 'Backend', technology: 'Node.js Express REST API with live match event handlers' },
        { layer: 'Database', technology: 'PostgreSQL with Prisma ORM for relational match indexing' },
      ],
      deliverables: [
        'Tournament Administration Suite & Public Fan Portal',
        'Pitchside Referee Match Event Logging Interface',
        'PostgreSQL Database Architecture & Migrations',
        'Cloud Deployment with Automated CDN Caching',
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

  // Create Requirement record in PostgreSQL via Prisma
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

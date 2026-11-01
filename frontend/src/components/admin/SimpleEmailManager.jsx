import React, { useState, useEffect } from 'react';
import {
  Mail,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings2,
  Clock,
  User,
  History,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  FileText,
  Briefcase,
  Layers,
  Award,
  Info,
  HelpCircle,
} from 'lucide-react';
import { adminApi } from '../../services/api';

/**
 * Format email type into user-friendly category badge with distinct styling & icons
 * Categories: Test Email, Inquiry Confirmation, Inquiry Status Update, Project Proposal,
 * Project Status Update, Project Completion, Admin Notification
 */
const formatEmailType = (log) => {
  if (!log) {
    return {
      label: 'Admin Notification',
      category: 'Admin Notification',
      icon: ShieldAlert,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      isTest: false,
    };
  }

  const cat = log.category || '';
  const title = (log.title || '').toLowerCase();
  const details = log.deliveryDetails || {};
  const notifType = (details.notificationType || log.type || '').toLowerCase();
  const isTest = log.isTest || notifType.includes('test') || title.includes('test');

  // 1. Test Email (Distinct visual style, never presented as customer inquiry)
  if (isTest || cat === 'Test Email') {
    return {
      label: 'Test Email',
      category: 'Test Email',
      icon: FlaskConical,
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      isTest: true,
    };
  }

  // 2. Inquiry Confirmation
  if (
    cat === 'Inquiry Confirmation' ||
    notifType.includes('inquiry_created') ||
    notifType.includes('confirmation') ||
    (title.includes('inquiry') && (title.includes('received') || title.includes('confirmation')))
  ) {
    return {
      label: 'Inquiry Confirmation',
      category: 'Inquiry Confirmation',
      icon: FileText,
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      isTest: false,
    };
  }

  // 3. Inquiry Status Update
  if (
    cat === 'Inquiry Status Update' ||
    notifType.includes('inquiry_status') ||
    (title.includes('inquiry') && title.includes('status'))
  ) {
    return {
      label: 'Inquiry Status Update',
      category: 'Inquiry Status Update',
      icon: RefreshCw,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      isTest: false,
    };
  }

  // 4. Project Proposal
  if (cat === 'Project Proposal' || notifType.includes('proposal') || title.includes('proposal')) {
    return {
      label: 'Project Proposal',
      category: 'Project Proposal',
      icon: Briefcase,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      isTest: false,
    };
  }

  // 5. Project Completion
  if (
    cat === 'Project Completion' ||
    notifType.includes('complete') ||
    title.includes('completed') ||
    title.includes('completion')
  ) {
    return {
      label: 'Project Completion',
      category: 'Project Completion',
      icon: Award,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      isTest: false,
    };
  }

  // 6. Project Status Update
  if (
    cat === 'Project Status Update' ||
    notifType.includes('project') ||
    log.project ||
    title.includes('project')
  ) {
    return {
      label: 'Project Status Update',
      category: 'Project Status Update',
      icon: Layers,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      isTest: false,
    };
  }

  // 7. Admin Notification
  return {
    label: 'Admin Notification',
    category: 'Admin Notification',
    icon: ShieldAlert,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    isTest: false,
  };
};

export const SimpleEmailManager = ({ user, onToast }) => {
  // Can manage advanced technical settings
  const canManageSystemSettings = Boolean(
    user?.isSuperAdmin || user?.permissions?.includes('manage_system_settings')
  );

  // High-level state
  const [activeProvider, setActiveProvider] = useState('gmail'); // 'gmail' | 'resend'
  const [statusData, setStatusData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Gmail simple form state
  const [gmailAddress, setGmailAddress] = useState('');
  const [gmailAppPass, setGmailAppPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingGmail, setIsEditingGmail] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState(false);

  // Test email state
  const [showTestEmailBox, setShowTestEmailBox] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [confirmSendTest, setConfirmSendTest] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);

  // Advanced Resend accordion
  const [showAdvancedResend, setShowAdvancedResend] = useState(false);
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromAddress, setResendFromAddress] = useState('Special Tech <onboarding@resend.dev>');
  const [savingResend, setSavingResend] = useState(false);
  const [testingResend, setTestingResend] = useState(false);
  const [resendTestResult, setResendTestResult] = useState(null);

  // Email Activity Logs & Filter state
  const [emailLogs, setEmailLogs] = useState([]);
  const [logsSummary, setLogsSummary] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    bounced: 0,
  });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'customer' | 'test'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'sent' | 'delivered' | 'failed' | 'bounced'
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [retryingLogId, setRetryingLogId] = useState(null);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState(null);

  // Load status and logs on mount
  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailLogs = async (params = {}) => {
    setLoadingLogs(true);
    try {
      const qParams = {
        page: params.page !== undefined ? params.page : page,
        limit: params.limit !== undefined ? params.limit : limit,
        category: params.category !== undefined ? params.category : categoryFilter,
        status: params.status !== undefined ? params.status : statusFilter,
        search: (params.search !== undefined ? params.search : searchQuery).trim(),
      };
      const res = await adminApi.getEmailLogs(qParams).catch(() => ({}));
      if (res.data?.success) {
        setEmailLogs(res.data.data || []);
        if (res.data.summary) {
          setLogsSummary(res.data.summary);
        }
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total !== undefined ? res.data.total : (res.data.data || []).length);
      }
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadEmailData = async () => {
    setLoadingStatus(true);
    try {
      const statRes = await adminApi.getEmailStatus().catch(() => ({}));
      if (statRes.data?.success) {
        const data = statRes.data.data;
        setStatusData(data);
        if (data.provider) {
          setActiveProvider(data.provider);
        }
        if (data.gmailConfig?.user) {
          setGmailAddress(data.gmailConfig.user);
        }
        if (data.resendConfig?.from) {
          setResendFromAddress(data.resendConfig.from);
        }
        setTestEmailRecipient((prev) => {
          if (prev) return prev;
          if (data.provider === 'gmail' && data.gmailConfig?.user) return data.gmailConfig.user;
          return data.resendPermittedRecipient || data.adminEmail || '';
        });
      }
      await loadEmailLogs({ page: 1, limit: 15 });
    } finally {
      setLoadingStatus(false);
    }
  };

  // Re-fetch when category, status, page, or limit changes
  useEffect(() => {
    loadEmailLogs({ page, limit, category: categoryFilter, status: statusFilter, search: searchQuery });
  }, [categoryFilter, statusFilter, page, limit]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadEmailLogs({ page: 1, limit, category: categoryFilter, status: statusFilter, search: searchQuery });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const notify = (type, title, message) => {
    if (onToast) {
      onToast({ type, title, message });
    }
  };

  // Determine simple connection status for Gmail
  const isGmailActive = (statusData?.provider || activeProvider) === 'gmail';
  const hasGmailSaved = Boolean(statusData?.gmailConfig?.hasPass);
  const isGmailConnected =
    isGmailActive && hasGmailSaved && statusData?.authStatus === 'VERIFIED';
  const isGmailFailed =
    isGmailActive &&
    (statusData?.authStatus === 'AUTH_FAILED' || statusData?.authStatus === 'UNREACHABLE');

  let connectionStatus = 'Not Connected';
  if (connectingGmail) {
    connectionStatus = 'Connecting';
  } else if (isGmailConnected) {
    connectionStatus = 'Connected';
  } else if (isGmailFailed) {
    connectionStatus = 'Connection Failed';
  } else if (hasGmailSaved) {
    connectionStatus = 'Connected';
  }

  // Connect Gmail Action
  const handleConnectGmail = async (e) => {
    if (e) e.preventDefault();

    if (!gmailAddress || !gmailAddress.includes('@')) {
      notify('error', 'Validation Error', 'Please enter a valid Gmail address.');
      return;
    }

    if (!hasGmailSaved && !gmailAppPass.trim()) {
      notify(
        'error',
        'Validation Error',
        'Google App Password is required. Please generate a 16-character App Password at myaccount.google.com/apppasswords.'
      );
      return;
    }

    setConnectingGmail(true);
    try {
      const payload = {
        provider: 'gmail',
        gmailUser: gmailAddress.trim(),
        gmailPass: gmailAppPass.trim() || undefined,
        gmailFromName: 'Special Tech',
        gmailFromEmail: gmailAddress.trim(),
      };

      const saveRes = await adminApi.saveEmailSettings(payload);
      if (!saveRes.data?.success) {
        throw new Error(saveRes.data?.message || 'Failed to save Gmail configuration.');
      }

      // Immediately test live SMTP socket authentication to verify connection
      const testRes = await adminApi.testSMTPConnection({
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        user: gmailAddress.trim(),
        pass: gmailAppPass.trim() || undefined,
      }).catch((err) => ({
        data: { success: false, message: err.response?.data?.message || err.message },
      }));

      // Refresh live status and logs
      const [statRes, logsRes] = await Promise.all([
        adminApi.getEmailStatus().catch(() => ({})),
        adminApi.getEmailLogs().catch(() => ({})),
      ]);
      if (statRes.data?.success) setStatusData(statRes.data.data);
      if (logsRes.data?.success) setEmailLogs(logsRes.data.data);

      if (testRes.data?.success) {
        notify('success', 'Gmail Connected', `Successfully connected to Gmail as ${gmailAddress}!`);
        setIsEditingGmail(false);
        setGmailAppPass('');
        setActiveProvider('gmail');
      } else {
        notify(
          'error',
          'Authentication Notice',
          `Gmail saved, but connection check reported: ${testRes.data?.message || 'Check your App Password.'}`
        );
        setIsEditingGmail(false);
      }
    } catch (err) {
      notify(
        'error',
        'Connection Failed',
        err.response?.data?.message || err.message || 'Failed to connect Gmail account.'
      );
    } finally {
      setConnectingGmail(false);
    }
  };

  // Test Email Dispatch Action
  const handleSendTestEmail = async (e) => {
    if (e) e.preventDefault();
    const recipient = (testEmailRecipient || '').trim();

    if (!recipient || !recipient.includes('@')) {
      notify('error', 'Validation Error', 'Please enter a valid recipient email address.');
      return;
    }

    // Check placeholder domains
    const isPlaceholder = recipient.toLowerCase().endsWith('@example.com') || recipient.toLowerCase().endsWith('@test.com');
    if (isPlaceholder) {
      notify(
        'error',
        'Placeholder Domain Rejected',
        'example.com is an IANA documentation placeholder and cannot receive real emails. Please enter an active inbox address.'
      );
      return;
    }

    // Double-click prevention
    if (sendingTestEmail) return;

    setSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const res = await adminApi.sendTestEmail({ toEmail: recipient });
      setTestEmailResult(res.data);

      if (res.data?.success) {
        notify(
          'success',
          'Test Email Sent',
          `Test message successfully sent to ${recipient} (Message ID: ${res.data.messageId || 'Accepted'})`
        );
        setConfirmSendTest(false);
      } else {
        notify(
          'error',
          'Test Email Failed',
          res.data?.message || res.data?.error || 'Email dispatch was rejected.'
        );
      }

      await loadEmailLogs();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to send test email.';
      setTestEmailResult({ success: false, error: errMsg });
      notify('error', 'Test Email Error', errMsg);
      await loadEmailLogs();
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Save Resend Settings Action
  const handleSaveResend = async (e) => {
    if (e) e.preventDefault();
    const hasExistingResend = Boolean(statusData?.resendConfig?.hasPass);
    if (!hasExistingResend && !resendApiKey.trim()) {
      notify('error', 'Validation Error', 'Resend API Key is required.');
      return;
    }

    setSavingResend(true);
    try {
      const payload = {
        provider: 'resend',
        resendHost: 'smtp.resend.com',
        resendPort: 465,
        resendUser: 'resend',
        resendPass: resendApiKey.trim() || undefined,
        resendFrom: resendFromAddress.trim() || 'Special Tech <onboarding@resend.dev>',
      };

      const res = await adminApi.saveEmailSettings(payload);
      if (res.data?.success) {
        notify('success', 'Resend Configured', 'Resend configuration saved and activated.');
        setActiveProvider('resend');
        setResendApiKey('');
        const [statRes, logsRes] = await Promise.all([
          adminApi.getEmailStatus().catch(() => ({})),
          adminApi.getEmailLogs().catch(() => ({})),
        ]);
        if (statRes.data?.success) setStatusData(statRes.data.data);
        if (logsRes.data?.success) setEmailLogs(logsRes.data.data);
      }
    } catch (err) {
      notify(
        'error',
        'Save Failed',
        err.response?.data?.message || err.message || 'Failed to save Resend settings.'
      );
    } finally {
      setSavingResend(false);
    }
  };

  // Test Resend Connection Action
  const handleTestResendConnection = async () => {
    setTestingResend(true);
    setResendTestResult(null);
    try {
      const res = await adminApi.testSMTPConnection({
        provider: 'resend',
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        user: 'resend',
        pass: resendApiKey.trim() || undefined,
        from: resendFromAddress.trim(),
      });
      setResendTestResult(res.data);
      if (res.data?.success) {
        notify('success', 'Resend Verified', 'Resend SMTP authentication verified successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Resend connection test failed.';
      setResendTestResult({ success: false, message: msg });
      notify('error', 'Resend Error', msg);
    } finally {
      setTestingResend(false);
    }
  };

  // Retry Failed Email Action
  const handleRetryEmail = async (logId) => {
    if (retryingLogId) return;
    setRetryingLogId(logId);
    try {
      const res = await adminApi.retryEmailNotification(logId);
      if (res.data?.success) {
        notify(
          'success',
          'Email Retried Successfully',
          res.data.message || 'Email successfully retried and accepted by active provider!'
        );
      } else {
        notify(
          res.data?.alreadyDelivered ? 'warning' : 'error',
          res.data?.alreadyDelivered ? 'Duplicate Prevented' : 'Retry Failed',
          res.data?.message || 'Email retry failed.'
        );
      }
      await loadEmailLogs();
      if (selectedLogForDetails?.id === logId) {
        const qRes = await adminApi.getEmailLogs({ page, limit, category: categoryFilter, status: statusFilter, search: searchQuery }).catch(() => ({}));
        if (qRes.data?.data) {
          const updated = qRes.data.data.find((l) => l.id === logId);
          if (updated) setSelectedLogForDetails(updated);
        }
      }
    } catch (err) {
      const isDuplicate = err.response?.status === 409 || err.response?.data?.alreadyDelivered;
      notify(
        isDuplicate ? 'warning' : 'error',
        isDuplicate ? 'Duplicate Prevented' : 'Retry Failed',
        err.response?.data?.message || err.message || 'Failed to retry email delivery.'
      );
    } finally {
      setRetryingLogId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SIMPLE EMAIL SETUP CARD */}
      <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 hover:shadow-soft transition-all">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-brand-blue dark:text-brand-cyan flex items-center justify-center border border-blue-500/20">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Email Setup</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose how Special Tech sends client proposals, project updates, and system notifications.
                </p>
              </div>
            </div>
          </div>

          {/* Simple Global Provider Pill */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Active Service:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                activeProvider === 'gmail'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeProvider === 'gmail' ? 'bg-rose-500' : 'bg-cyan-500'
                }`}
              />
              <span>{activeProvider === 'gmail' ? 'Gmail' : 'Resend'}</span>
            </span>
          </div>
        </div>

        {/* PROVIDER SELECTOR (Gmail Recommended vs Resend Advanced) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono block">
            Select Email Provider
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* GMAIL OPTION (RECOMMENDED & DEFAULT) */}
            <button
              type="button"
              onClick={() => {
                setActiveProvider('gmail');
                if (statusData?.provider !== 'gmail' && hasGmailSaved) {
                  // Switch active provider to Gmail
                  adminApi
                    .saveEmailSettings({
                      provider: 'gmail',
                      gmailUser: statusData?.gmailConfig?.user || gmailAddress,
                      gmailFromName: 'Special Tech',
                      gmailFromEmail: statusData?.gmailConfig?.user || gmailAddress,
                    })
                    .then(() => loadEmailData())
                    .catch(() => {});
                }
              }}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                activeProvider === 'gmail'
                  ? 'bg-blue-500/5 dark:bg-blue-950/30 border-brand-blue dark:border-cyan-400 ring-2 ring-brand-blue/20 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg font-mono border border-rose-500/20">
                    G
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <span>Gmail</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Recommended
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Google Account & App Password</div>
                  </div>
                </div>

                {activeProvider === 'gmail' && (
                  <span className="w-5 h-5 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs shadow-sm">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                Fast, reliable delivery to any customer inbox with zero domain DNS setup.
              </p>
            </button>

            {/* RESEND OPTION (ADVANCED) */}
            <button
              type="button"
              onClick={() => {
                setActiveProvider('resend');
                setShowAdvancedResend(true);
              }}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                activeProvider === 'resend'
                  ? 'bg-blue-500/5 dark:bg-blue-950/30 border-brand-blue dark:border-cyan-400 ring-2 ring-brand-blue/20 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-lg font-mono border border-cyan-500/20">
                    R
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <span>Resend</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                        Advanced
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Cloud API Relay</div>
                  </div>
                </div>

                {activeProvider === 'resend' && (
                  <span className="w-5 h-5 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs shadow-sm">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                For verified enterprise custom domains. Requires DNS records setup.
              </p>
            </button>
          </div>
        </div>

        {/* 2. GMAIL SIMPLE CONFIGURATION & STATUS */}
        {activeProvider === 'gmail' && (
          <div className="pt-2 space-y-4">
            {/* A. If Connected and NOT in edit mode -> SHOW STATUS CARD */}
            {hasGmailSaved && !isEditingGmail ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-5">
                {/* Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                      Connection Status
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                          connectionStatus === 'Connected'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : connectionStatus === 'Connecting'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                            : connectionStatus === 'Connection Failed'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            connectionStatus === 'Connected'
                              ? 'bg-emerald-500 animate-pulse'
                              : connectionStatus === 'Connecting'
                              ? 'bg-blue-500 animate-spin'
                              : connectionStatus === 'Connection Failed'
                              ? 'bg-rose-500'
                              : 'bg-slate-500'
                          }`}
                        />
                        <span>{connectionStatus}</span>
                      </span>

                      {statusData?.latencyMs && connectionStatus === 'Connected' && (
                        <span className="text-[11px] font-mono text-slate-400">
                          ({statusData.latencyMs}ms response time)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Action 1: Test Email */}
                    <button
                      type="button"
                      onClick={() => setShowTestEmailBox((prev) => !prev)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                        showTestEmailBox
                          ? 'bg-brand-blue text-white border-brand-blue'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-brand-blue'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{showTestEmailBox ? 'Close Test Email' : 'Test Email'}</span>
                    </button>

                    {/* Action 2: Change Email Account */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingGmail(true);
                        setShowTestEmailBox(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:border-brand-blue dark:hover:border-cyan-400 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Change Email Account</span>
                    </button>
                  </div>
                </div>

                {/* Connected Account Display */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                      Connected Gmail Address
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-base break-all">
                      {statusData?.gmailConfig?.user || gmailAddress || 'nanishaabdi2504@gmail.com'}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Customer proposals, milestone notifications, and inquiry status emails are sent from this address.
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-brand-blue dark:text-cyan-400 border border-blue-500/20 shrink-0 self-start sm:self-center">
                    Google App Password Active
                  </span>
                </div>

                {/* Connection Failed Diagnostics (if error occurred) */}
                {isGmailFailed && statusData?.lastError && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Gmail Connection Check Failed</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                      {statusData.lastError}
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingGmail(true)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>Update Gmail App Password</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* INLINE TEST EMAIL DRAWER (Requirement 7) */}
                {showTestEmailBox && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendTestEmail(e);
                    }}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-brand-blue dark:text-cyan-400 flex items-center justify-center">
                          <Send className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                            Send Live Test Email via Gmail
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            Dispatches real verification message through smtp.gmail.com:465
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTestEmailBox(false);
                          setConfirmSendTest(false);
                        }}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Educational note on real inboxes vs example.com */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                      <div className="space-y-0.5">
                        <span className="font-bold block">Real Recipient Address Required</span>
                        <p className="leading-relaxed">
                          Addresses ending in <code className="font-mono font-bold text-amber-800 dark:text-amber-200">@example.com</code> or <code className="font-mono font-bold text-amber-800 dark:text-amber-200">@test.com</code> are IANA reserved documentation placeholders and cannot receive real emails. Please enter an active inbox you can verify.
                        </p>
                      </div>
                    </div>

                    {/* Input Field with inline validation */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs">
                        Recipient Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={testEmailRecipient}
                        onChange={(e) => {
                          setTestEmailRecipient(e.target.value);
                          setConfirmSendTest(false);
                        }}
                        placeholder="your.email@gmail.com"
                        required
                        className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border text-slate-900 dark:text-white text-xs font-mono focus:outline-none transition-colors ${
                          (testEmailRecipient.toLowerCase().endsWith('@example.com') || testEmailRecipient.toLowerCase().endsWith('@test.com'))
                            ? 'border-rose-400 focus:border-rose-500'
                            : 'border-slate-300 dark:border-slate-700 focus:border-brand-blue'
                        }`}
                      />
                      {(testEmailRecipient.toLowerCase().endsWith('@example.com') || testEmailRecipient.toLowerCase().endsWith('@test.com')) && (
                        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>example.com is an IANA placeholder domain and cannot receive email.</span>
                        </p>
                      )}
                    </div>

                    {/* 2-Step Confirmation or Submit */}
                    {confirmSendTest ? (
                      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-brand-blue dark:text-cyan-400 space-y-2.5 animate-fade-in">
                        <div className="flex items-center gap-2 font-bold">
                          <HelpCircle className="w-4 h-4 shrink-0" />
                          <span>Confirm Live Test Dispatch</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                          Are you sure you want to send a live test message to <strong className="font-mono text-slate-900 dark:text-white">{testEmailRecipient}</strong> using connected Gmail credentials?
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleSendTestEmail}
                            disabled={sendingTestEmail}
                            className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            <Send className={`w-3.5 h-3.5 ${sendingTestEmail ? 'animate-pulse' : ''}`} />
                            <span>{sendingTestEmail ? 'Sending...' : 'Yes, Confirm & Send'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmSendTest(false)}
                            disabled={sendingTestEmail}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const recipient = (testEmailRecipient || '').trim();
                            if (!recipient || !recipient.includes('@')) {
                              notify('error', 'Validation Error', 'Please enter a valid recipient email address.');
                              return;
                            }
                            if (recipient.toLowerCase().endsWith('@example.com') || recipient.toLowerCase().endsWith('@test.com')) {
                              notify('error', 'Placeholder Rejected', 'example.com is a placeholder domain and cannot receive real emails.');
                              return;
                            }
                            setConfirmSendTest(true);
                          }}
                          disabled={
                            sendingTestEmail ||
                            !testEmailRecipient ||
                            testEmailRecipient.toLowerCase().endsWith('@example.com') ||
                            testEmailRecipient.toLowerCase().endsWith('@test.com')
                          }
                          className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Test Email</span>
                        </button>
                      </div>
                    )}

                    {/* Actual Sending Result Display */}
                    {testEmailResult && (
                      <div
                        className={`p-3.5 rounded-xl text-xs font-mono border ${
                          testEmailResult.success
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          {testEmailResult.success ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>Test Email Delivered!</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                              <span>Dispatch Failed</span>
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] break-all leading-relaxed">
                          {testEmailResult.message || testEmailResult.error}
                        </p>
                        {testEmailResult.messageId && (
                          <div className="mt-1.5 pt-1.5 border-t border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="font-bold">Message ID:</span>
                            <span className="font-mono">{testEmailResult.messageId}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </form>
                )}
              </div>
            ) : (
              /* B. If NOT connected or in Edit Mode -> SHOW CLEAN 2-FIELD GMAIL FORM */
              <form
                onSubmit={handleConnectGmail}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-5 animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {isEditingGmail ? 'Change Gmail Account' : 'Connect Gmail Account'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Special Tech automatically configures port, encryption, and server addresses in the background.
                    </p>
                  </div>

                  {isEditingGmail && (
                    <button
                      type="button"
                      onClick={() => setIsEditingGmail(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* SIMPLE 2 FIELDS: Gmail Address & Google App Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 1: Gmail address */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      Gmail Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={gmailAddress}
                      onChange={(e) => setGmailAddress(e.target.value)}
                      placeholder="yourname@gmail.com"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-brand-blue shadow-sm"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Your Google Account or Google Workspace email address.
                    </span>
                  </div>

                  {/* Field 2: Google App Password */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      Google App Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={gmailAppPass}
                        onChange={(e) => setGmailAppPass(e.target.value)}
                        placeholder={
                          hasGmailSaved
                            ? '•••••••••••••••• (Leave blank to keep existing password)'
                            : '16-character App Password (e.g. abcd efgh ijkl mnop)'
                        }
                        className="w-full px-4 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-brand-blue shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Never enter your regular Gmail password. Spaces are stripped automatically.
                    </span>
                  </div>
                </div>

                {/* BRIEF APP PASSWORD GUIDE */}
                <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/15 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-brand-blue dark:text-brand-cyan" />
                      <span>How to generate a Google App Password</span>
                    </span>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue dark:text-brand-cyan hover:underline text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span>Open Google Security</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    <li>
                      Turn on <strong>2-Step Verification</strong> in your Google Account security settings.
                    </li>
                    <li>
                      Go to{' '}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue dark:text-cyan-400 underline font-semibold"
                      >
                        myaccount.google.com/apppasswords
                      </a>.
                    </li>
                    <li>
                      Create a password named <strong>Special Tech</strong> and paste the 16-character code into the field above.
                    </li>
                  </ol>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={connectingGmail}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue flex items-center gap-2 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${connectingGmail ? 'animate-spin' : ''}`} />
                    <span>{connectingGmail ? 'Connecting Gmail...' : 'Connect Gmail'}</span>
                  </button>

                  {isEditingGmail && (
                    <button
                      type="button"
                      onClick={() => setIsEditingGmail(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* 3. RESEND ADVANCED SETTINGS (EXPANDABLE ACCORDION) */}
        {canManageSystemSettings && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowAdvancedResend((prev) => !prev)}
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-left transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <span>Advanced Email Settings (Resend)</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold uppercase">
                      Admin Only
                    </span>
                    {activeProvider === 'resend' && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                        Active Provider
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Custom domain verification, Resend API key, and cloud delivery settings.
                  </p>
                </div>
              </div>

              <div className="text-slate-400">
                {showAdvancedResend ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* EXPANDABLE RESEND FORM */}
            {showAdvancedResend && (
              <div className="p-5 mt-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in text-xs">
                {/* Switch to Resend Action if Gmail is active */}
                {activeProvider !== 'resend' && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Switch Active Provider to Resend?
                      </span>
                      <span className="text-[11px] text-slate-500">
                        All new emails and retries will be routed through Resend SMTP.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveResend}
                      disabled={savingResend}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-sm shrink-0"
                    >
                      Set Resend as Active Provider
                    </button>
                  </div>
                )}

                {/* Resend Testing Mode Notice */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-300 space-y-1 text-[11px] leading-relaxed">
                  <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Resend Testing Mode (550 Restriction)</span>
                  </div>
                  <p>
                    Without custom domain DNS verification at{' '}
                    <a
                      href="https://resend.com/domains"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue dark:text-cyan-400 underline font-semibold"
                    >
                      resend.com/domains
                    </a>
                    , Resend delivers exclusively to verified account owner ({statusData?.resendPermittedRecipient || 'naniabdi2504@gmail.com'}). External customer emails will be rejected. Use Gmail (Recommended) above for unrestricted delivery.
                  </p>
                </div>

                {/* Resend Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      Resend API Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      placeholder={
                        statusData?.resendConfig?.hasPass
                          ? '•••••••••••••••• (Configured in database)'
                          : 're_123456789...'
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      Sender Address (From) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={resendFromAddress}
                      onChange={(e) => setResendFromAddress(e.target.value)}
                      placeholder="Special Tech <onboarding@resend.dev>"
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveResend}
                    disabled={savingResend}
                    className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {savingResend ? 'Saving...' : 'Save Resend Settings'}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestResendConnection}
                    disabled={testingResend}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:border-brand-blue transition-colors cursor-pointer"
                  >
                    {testingResend ? 'Testing...' : 'Test Resend Connection'}
                  </button>
                </div>

                {resendTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs font-mono border ${
                      resendTestResult.success
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {resendTestResult.message || (resendTestResult.success ? 'Resend Connected' : 'Resend Failed')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. EMAIL ACTIVITY DASHBOARD (Requirements 2, 3, 4, 5, 6, 8) */}
      <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 hover:shadow-soft transition-all">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
              <span>Email Activity Dashboard</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live telemetry, delivery status, customer communication audit trail, and diagnostics.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              await loadEmailLogs();
              notify('info', 'Activity Refreshed', 'Email activity logs have been refreshed.');
            }}
            disabled={loadingLogs}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            <span>{loadingLogs ? 'Refreshing...' : 'Refresh Activity'}</span>
          </button>
        </div>

        {/* 4.1 DASHBOARD SUMMARY KPI CARDS (Requirement 8) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Total Emails */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono uppercase font-bold">Total Emails</span>
              <Mail className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {logsSummary.total}
            </div>
            <span className="text-[10px] text-slate-400 block">All tracked dispatches</span>
          </div>

          {/* Sent (SMTP Accepted) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-emerald-500/20 dark:border-emerald-500/20 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-[11px] font-mono uppercase font-bold">Sent</span>
              <Check className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {logsSummary.sent}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
              Accepted by SMTP server
            </span>
          </div>

          {/* Delivered (Evidence confirmed) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-cyan-500/20 dark:border-cyan-500/20 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400">
              <span className="text-[11px] font-mono uppercase font-bold">Delivered</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {logsSummary.delivered}
            </div>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium block">
              Confirmed delivery evidence
            </span>
          </div>

          {/* Failed */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-rose-500/20 dark:border-rose-500/20 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span className="text-[11px] font-mono uppercase font-bold">Failed</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {logsSummary.failed}
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">
              Authentication or provider rejections
            </span>
          </div>

          {/* Pending */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-amber-500/20 dark:border-amber-500/20 shadow-xs space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="text-[11px] font-mono uppercase font-bold">Pending</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {logsSummary.pending}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
              Queued for dispatch
            </span>
          </div>
        </div>


        {/* 4.2 FILTERS & SEARCH BAR (Requirement 4) */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs self-start overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'All Emails' },
                { id: 'customer', label: 'Customer Emails' },
                { id: 'test', label: 'Test Emails' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                    categoryFilter === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: 'all', label: 'All Statuses' },
                { id: 'sent', label: 'Sent' },
                { id: 'delivered', label: 'Delivered' },
                { id: 'failed', label: 'Failed' },
                { id: 'bounced', label: 'Bounced' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st.id);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, recipient email, inquiry # (e.g., ST-INQ-2026-0045), or project..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-brand-blue"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4.3 ACTIVITY TABLE (Requirements 2, 3, 6) */}
        {loadingLogs ? (
          <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-brand-blue" />
            <p>Loading email logs...</p>
          </div>
        ) : emailLogs.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
            <Mail className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No email records found matching your filters.</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search query, category, or status filter.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500">
                  <tr>
                    <th className="p-3.5 font-bold">Recipient / Customer</th>
                    <th className="p-3.5 font-bold">Destination Email</th>
                    <th className="p-3.5 font-bold">Category</th>
                    <th className="p-3.5 font-bold">Provider</th>
                    <th className="p-3.5 font-bold">Status</th>
                    <th className="p-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-950">
                  {emailLogs.map((log) => {
                    const details = log.deliveryDetails || {};
                    const isSent = log.deliveryStatus === 'SENT' || log.deliveryStatus === 'DELIVERED';
                    const isFailed = log.deliveryStatus === 'FAILED';
                    const isDelivered = log.deliveryStatus === 'DELIVERED';
                    const typeBadge = formatEmailType(log);
                    const CategoryIcon = typeBadge.icon || Mail;

                    // Dynamic customer name resolution (Requirement 3: Never hardcode, display Test Recipient for test emails)
                    const customerName = log.customerName || (typeBadge.isTest ? 'Test Recipient' : (log.customer?.name || (details.inquiryNumber ? `Client (#${details.inquiryNumber})` : 'Customer')));
                    const recipientEmail = details.recipientEmail || log.customer?.email || 'N/A';
                    const inquiryNum = details.inquiryNumber || log.inquiry?.inquiryNumber;

                    const providerStr = (details.provider || '').toLowerCase().includes('gmail')
                      ? 'Gmail'
                      : (details.provider || '').toLowerCase().includes('resend')
                      ? 'Resend'
                      : 'Gmail';

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        {/* Customer / Recipient */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {typeBadge.isTest ? (
                              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                <FlaskConical className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan flex items-center justify-center font-bold text-xs shrink-0 border border-brand-blue/20">
                                {(customerName[0] || 'C').toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold block truncate ${typeBadge.isTest ? 'text-slate-600 dark:text-slate-400 font-mono text-xs' : 'text-slate-900 dark:text-white text-xs'}`}>
                                  {customerName}
                                </span>
                                {typeBadge.isTest && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                                    Test
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                <span>
                                  {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {inquiryNum && (
                                  <span className="text-brand-blue dark:text-brand-cyan font-semibold">
                                    #{inquiryNum}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="p-3.5 font-mono text-[11px]">
                          <span className="text-slate-800 dark:text-slate-200 font-semibold break-all">
                            {recipientEmail}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border inline-flex items-center gap-1.5 ${typeBadge.color}`}
                          >
                            <CategoryIcon className="w-3 h-3" />
                            <span>{typeBadge.label}</span>
                          </span>
                        </td>

                        {/* Provider */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border inline-flex items-center gap-1.5 ${
                              providerStr === 'Gmail'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                providerStr === 'Gmail' ? 'bg-rose-500' : 'bg-cyan-500'
                              }`}
                            />
                            <span>{providerStr}</span>
                          </span>
                        </td>

                        {/* Status (Never show failed as sent!) */}
                        <td className="p-3.5 whitespace-nowrap">
                          {isDelivered ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Delivered</span>
                            </span>
                          ) : isSent ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Sent</span>
                            </span>
                          ) : isFailed ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Failed</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Actions: View Details & Retry Failed Email */}
                        <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLogForDetails(log)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Details</span>
                          </button>

                          {/* Retry button ONLY for eligible failed customer communications (Requirement 6) */}
                          {!typeBadge.isTest && isFailed && log.canRetry !== false && !recipientEmail.toLowerCase().endsWith('@example.com') && (
                            <button
                              type="button"
                              onClick={() => handleRetryEmail(log.id)}
                              disabled={retryingLogId === log.id}
                              className="px-3 py-1.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                              <RefreshCw
                                className={`w-3 h-3 ${retryingLogId === log.id ? 'animate-spin' : ''}`}
                              />
                              <span>{retryingLogId === log.id ? 'Retrying...' : 'Retry Email'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4.4 PAGINATION CONTROLS (Requirement 4) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>
                  Showing {Math.min((page - 1) * limit + 1, totalCount)} to {Math.min(page * limit, totalCount)} of {totalCount} records
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div className="flex items-center gap-1">
                  <span>Per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <span className="px-3 py-1.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. ENHANCED EMAIL ACTIVITY DETAILS MODAL (Requirements 3, 5, 6) */}
      {selectedLogForDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedLogForDetails(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-brand-blue dark:text-cyan-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Email Delivery Record & Diagnostics
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedLogForDetails.id}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLogForDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core Diagnostics Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              {/* Customer Name */}
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                  Customer Name
                </span>
                <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                  {selectedLogForDetails.customerName || (selectedLogForDetails.isTest ? 'Test Recipient' : (selectedLogForDetails.customer?.name || 'Customer'))}
                </span>
              </div>

              {/* Recipient Email */}
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                  Actual Recipient Email
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white break-all text-[11px] block mt-0.5">
                  {selectedLogForDetails.deliveryDetails?.recipientEmail || selectedLogForDetails.customer?.email || 'N/A'}
                </span>
              </div>

              {/* Email Category */}
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                  Email Category
                </span>
                <div className="mt-1">
                  {(() => {
                    const badge = formatEmailType(selectedLogForDetails);
                    const BIcon = badge.icon || Mail;
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border inline-flex items-center gap-1 ${badge.color}`}>
                        <BIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Delivery Status */}
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                  Delivery Status
                </span>
                <span
                  className={`font-mono font-bold text-[11px] block mt-1 ${
                    selectedLogForDetails.deliveryStatus === 'DELIVERED'
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : selectedLogForDetails.deliveryStatus === 'SENT'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {selectedLogForDetails.deliveryStatus === 'DELIVERED'
                    ? '✓ Delivered (Confirmed)'
                    : selectedLogForDetails.deliveryStatus === 'SENT'
                    ? '✓ Sent (Accepted by SMTP)'
                    : '✗ Delivery Failed'}
                </span>
              </div>

              {/* Provider Used */}
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                  Provider Used
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {selectedLogForDetails.deliveryDetails?.provider || 'Gmail SMTP'}
                </span>
              </div>

              {/* Date & Time */}
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                  Date and Time
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] block mt-0.5">
                  {new Date(selectedLogForDetails.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Subject */}
              <div className="col-span-2">
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                  Subject / Title
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {selectedLogForDetails.title || 'Email Notification'}
                </span>
              </div>

              {/* Next Retry Provider */}
              <div className="col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                  Next Retry Provider
                </span>
                <span className="font-mono text-[11px] font-bold text-brand-blue dark:text-brand-cyan">
                  {selectedLogForDetails.nextRetryProvider || `${activeProvider === 'gmail' ? 'Gmail SMTP' : 'Resend SMTP'} (Active)`}
                </span>
              </div>
            </div>

            {/* SMTP Response Code & Provider Message ID (Requirement 5) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* SMTP Response Code */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  SMTP Response Code
                </span>
                <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                  {selectedLogForDetails.smtpCode ? (
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white">
                      Code: {selectedLogForDetails.smtpCode}
                    </span>
                  ) : (
                    <span className="text-slate-400">N/A (Standard Handshake)</span>
                  )}
                </span>
              </div>

              {/* Message ID */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  Provider Message ID
                </span>
                <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 break-all block">
                  {selectedLogForDetails.deliveryDetails?.providerMessageId || 'No Message ID issued'}
                </span>
              </div>
            </div>

            {/* Human-Readable Explanation alongside Technical Error (Requirement 5) */}
            {selectedLogForDetails.deliveryStatus === 'FAILED' && (
              <div className="space-y-3 pt-1">
                {/* Human Explanation Card */}
                {selectedLogForDetails.humanExplanation && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>Diagnosis & Recommended Action</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {selectedLogForDetails.humanExplanation}
                    </p>
                  </div>
                )}

                {/* Technical Raw Error */}
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Exact Provider Error</span>
                  </div>
                  <pre className="text-[11px] font-mono leading-relaxed break-all whitespace-pre-wrap bg-white/50 dark:bg-slate-950/50 p-2.5 rounded-lg border border-rose-500/10">
                    {selectedLogForDetails.deliveryDetails?.errorMessage ||
                      selectedLogForDetails.deliveryDetails?.rawError ||
                      selectedLogForDetails.message ||
                      'Provider rejected email dispatch.'}
                  </pre>
                </div>

                {/* Audit Attempt History (Requirement 5) */}
                {Array.isArray(selectedLogForDetails.deliveryDetails?.attempts) &&
                  selectedLogForDetails.deliveryDetails.attempts.length > 0 && (
                    <div className="space-y-1.5 text-xs">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block flex items-center gap-1">
                        <History className="w-3 h-3" />
                        <span>Chronological Delivery Attempts ({selectedLogForDetails.deliveryDetails.attempts.length})</span>
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {selectedLogForDetails.deliveryDetails.attempts.map((att, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                Attempt #{att.attemptNumber || idx + 1}: {att.provider}
                              </span>
                              <span
                                className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                  att.deliveryStatus === 'SENT'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-rose-500/10 text-rose-500'
                                }`}
                              >
                                {att.deliveryStatus}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>{new Date(att.attemptAt).toLocaleString()}</span>
                              {att.providerMessageId && (
                                <span className="truncate max-w-[200px] text-emerald-600">
                                  ID: {att.providerMessageId}
                                </span>
                              )}
                            </div>
                            {att.errorMessage && (
                              <p className="text-[10px] text-rose-500 truncate">
                                {att.errorMessage}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Direct Retry Action inside Details modal (Only for eligible customer emails) */}
                {!selectedLogForDetails.isTest && selectedLogForDetails.canRetry !== false && !selectedLogForDetails.deliveryDetails?.recipientEmail?.toLowerCase().endsWith('@example.com') && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        await handleRetryEmail(selectedLogForDetails.id);
                      }}
                      disabled={retryingLogId === selectedLogForDetails.id}
                      className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${retryingLogId === selectedLogForDetails.id ? 'animate-spin' : ''}`}
                      />
                      <span>
                        {retryingLogId === selectedLogForDetails.id
                          ? 'Retrying Delivery...'
                          : 'Retry Email Delivery'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleEmailManager;

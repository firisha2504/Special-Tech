import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi, inquiryApi, projectApi } from '../services/api';
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  Users,
  Cpu,
  Settings,
  History,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Save,
  LogOut,
  Sparkles,
  ChevronRight,
  Eye,
  X,
  Filter,
  RefreshCw,
  Package,
  ArrowLeft,
  Mail,
  Send,
  Server,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import AdminLayout from '../layouts/AdminLayout';
import AdminProjectManager from '../features/admin/AdminProjectManager';
import AdminProductManager from '../features/admin/AdminProductManager';

const ADMIN_TABS = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'inquiries', name: 'Inquiries & Proposals', icon: Inbox, countKey: 'newInquiries' },
  { id: 'projects', name: 'Portfolio Projects', icon: Briefcase },
  { id: 'products', name: 'Products & Solutions', icon: Package, countKey: 'newDemoRequests' },
  { id: 'customers', name: 'Customer Directory', icon: Users },
  { id: 'ai', name: 'AI & Templates', icon: Cpu },
  { id: 'settings', name: 'Settings', icon: Settings },
  { id: 'logs', name: 'Audit Logs', icon: History },
];

export const AdminDashboardPage = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Active admin tab with URL search parameter persistence
  const validTabIds = ['overview', 'inquiries', 'projects', 'products', 'customers', 'ai', 'settings', 'logs'];
  const urlTab = searchParams.get('tab');
  const initialTab = validTabIds.includes(urlTab) ? urlTab : 'overview';
  const [activeTab, setActiveTabState] = useState(initialTab);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Sync activeTab if URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && validTabIds.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [searchParams]);

  // Data states
  const [stats, setStats] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [loading, setLoading] = useState(false);

  // AI Settings & Diagnostic state
  const [aiProvider, setAiProvider] = useState('built-in');
  const [geminiKey, setGeminiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [aiTestResult, setAiTestResult] = useState(null);
  const [testingAi, setTestingAi] = useState(false);
  const [liveAiStatus, setLiveAiStatus] = useState(null);
  const [aiConversations, setAiConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loadingConv, setLoadingConv] = useState(false);

  // Email / SMTP settings state
  const [smtpHost, setSmtpHost] = useState('smtp.resend.com');
  const [smtpPort, setSmtpPort] = useState('465');
  const [smtpUser, setSmtpUser] = useState('resend');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('Special Tech <info@specialtech.com>');
  const [adminEmailNotify, setAdminEmailNotify] = useState('contact@specialtech.com');
  const [smtpStatusData, setSmtpStatusData] = useState(null);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [sendTestEmailResult, setSendTestEmailResult] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await adminApi.getStats();
        if (res.data.success) setStats(res.data.data);
      } else if (activeTab === 'inquiries') {
        const res = await inquiryApi.getAll();
        if (res.data.success) setInquiries(res.data.data);
      } else if (activeTab === 'projects') {
        const res = await projectApi.getAll({ publishedOnly: 'false' });
        if (res.data.success) setProjects(res.data.data);
      } else if (activeTab === 'customers') {
        const res = await adminApi.getCustomers();
        if (res.data.success) setCustomers(res.data.data);
      } else if (activeTab === 'ai' || activeTab === 'settings') {
        const res = await adminApi.getSettings();
        if (res.data.success) {
          setSettings(res.data.data);
          const p = res.data.data.find((s) => s.key === 'ai_provider');
          if (p) setAiProvider(p.value);
          const m = res.data.data.find((s) => s.key === 'ai_model');
          if (m) setAiModel(m.value);
          const sh = res.data.data.find((s) => s.key === 'smtp_host');
          if (sh && sh.value) setSmtpHost(sh.value);
          const sp = res.data.data.find((s) => s.key === 'smtp_port');
          if (sp && sp.value) setSmtpPort(sp.value);
          const su = res.data.data.find((s) => s.key === 'smtp_user');
          if (su && su.value) setSmtpUser(su.value);
          const sf = res.data.data.find((s) => s.key === 'smtp_from');
          if (sf && sf.value) setSmtpFrom(sf.value);
          const sa = res.data.data.find((s) => s.key === 'admin_email');
          if (sa && sa.value) setAdminEmailNotify(sa.value);
        }
        adminApi.getEmailStatus().then((eRes) => {
          if (eRes.data?.success) {
            setSmtpStatusData(eRes.data.data);
            if (eRes.data.data.adminEmail) {
              setTestEmailRecipient((prev) => prev || eRes.data.data.adminEmail);
            }
          }
        }).catch(() => {});
        if (activeTab === 'ai') {
          aiApi.getStatus().then((s) => {
            if (s.data?.success) setLiveAiStatus(s.data);
          }).catch(() => {});
          const convRes = await adminApi.getConversations();
          if (convRes.data?.success) setAiConversations(convRes.data.data);
        }
      } else if (activeTab === 'logs') {
        const res = await adminApi.getActivityLogs();
        if (res.data.success) setActivityLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInquiry = async (inq) => {
    setSelectedInquiry(inq);
    try {
      const res = await inquiryApi.getById(inq.id);
      if (res.data?.success && res.data?.data) {
        setSelectedInquiry(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load full inquiry details:', err);
    }
  };

  const handleOpenConversation = async (convId) => {
    setLoadingConv(true);
    try {
      const res = await adminApi.getConversationById(convId);
      if (res.data?.success) {
        setSelectedConversation(res.data.data);
      }
    } catch (err) {
      alert('Failed to load conversation: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingConv(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setLoginError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleUpdateInquiryStatus = async (id, status, notes) => {
    try {
      const res = await inquiryApi.updateStatus(id, {
        status,
        internalNotes: notes,
      });
      if (res.data.success) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === id ? { ...inq, status, internalNotes: notes } : inq))
        );
        if (selectedInquiry?.id === id) {
          setSelectedInquiry((prev) => ({ ...prev, status, internalNotes: notes }));
        }
        alert('Inquiry status updated successfully.');
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleTestAIConnection = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await adminApi.testAIConnection();
      setAiTestResult(res.data);
      aiApi.getStatus().then((s) => {
        if (s.data?.success) setLiveAiStatus(s.data);
      }).catch(() => {});
    } catch (err) {
      setAiTestResult({
        success: false,
        status: 'error',
        message: err.response?.data?.message || err.message || 'Connection test failed',
      });
    } finally {
      setTestingAi(false);
    }
  };

  const handleSaveAISettings = async () => {
    try {
      await adminApi.updateSetting({ key: 'ai_provider', value: aiProvider });
      await adminApi.updateSetting({ key: 'ai_model', value: aiModel });
      if (geminiKey.trim()) {
        const keyName = aiProvider === 'openai' ? 'openai_api_key' : 'gemini_api_key';
        await adminApi.updateSetting({ key: keyName, value: geminiKey.trim() });
        setGeminiKey('');
      }
      alert('AI Configuration saved successfully to database!');
      const s = await aiApi.getStatus().catch(() => ({}));
      if (s.data?.success) setLiveAiStatus(s.data);
      loadDashboardData();
    } catch (err) {
      alert('Failed to save AI settings');
    }
  };

  const handleSaveSMTPSettings = async () => {
    try {
      await adminApi.updateSetting({ key: 'smtp_host', value: smtpHost });
      await adminApi.updateSetting({ key: 'smtp_port', value: smtpPort });
      await adminApi.updateSetting({ key: 'smtp_user', value: smtpUser });
      await adminApi.updateSetting({ key: 'smtp_from', value: smtpFrom });
      await adminApi.updateSetting({ key: 'admin_email', value: adminEmailNotify });
      if (smtpPass.trim()) {
        await adminApi.updateSetting({ key: 'smtp_pass', value: smtpPass.trim() });
        setSmtpPass('');
      }
      alert('SMTP Email Configuration saved successfully!');
      const stat = await adminApi.getEmailStatus().catch(() => ({}));
      if (stat.data?.success) setSmtpStatusData(stat.data.data);
      loadDashboardData();
    } catch (err) {
      alert('Failed to save SMTP settings: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTestSMTPConnection = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await adminApi.testSMTPConnection();
      setSmtpTestResult(res.data);
      const stat = await adminApi.getEmailStatus().catch(() => ({}));
      if (stat.data?.success) setSmtpStatusData(stat.data.data);
    } catch (err) {
      setSmtpTestResult({
        success: false,
        status: 'error',
        message: err.response?.data?.message || err.message || 'SMTP connection test failed',
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    setSendTestEmailResult(null);
    try {
      const res = await adminApi.sendTestEmail({ toEmail: testEmailRecipient });
      setSendTestEmailResult(res.data);
      const stat = await adminApi.getEmailStatus().catch(() => ({}));
      if (stat.data?.success) setSmtpStatusData(stat.data.data);
    } catch (err) {
      setSendTestEmailResult({
        success: false,
        error: err.response?.data?.message || err.message || 'Failed to dispatch test email',
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  // IF NOT AUTHENTICATED: DISPLAY ADMIN LOGIN GATE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020D20] text-slate-900 dark:text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Logo variant="horizontal" size="md" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Admin Control Center</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Administrative Control & Client Inquiries CRM
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@specialtech.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan text-sm shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-glow-blue transition-all"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In To Admin Portal'}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-cyan transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <AdminLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      stats={stats}
      loading={loading}
      onRefresh={loadDashboardData}
      user={user}
      onLogout={logout}
    >

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'overview' && (
        <div
          role="tabpanel"
          id="admin-panel-overview"
          aria-labelledby="admin-tab-overview"
          tabIndex={0}
          className="space-y-8 focus-visible:outline-none"
        >
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Inquiries', value: stats?.kpis?.totalInquiries ?? 0, color: 'text-slate-900 dark:text-white' },
              { label: 'New Inquiries', value: stats?.kpis?.newInquiries ?? 0, color: 'text-brand-blue dark:text-brand-cyan' },
              { label: 'Portfolio Projects', value: `${stats?.kpis?.activeProjects ?? 0} / ${stats?.kpis?.totalProjects ?? 0}`, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Company Products', value: `${stats?.kpis?.activeProducts ?? 0} / ${stats?.kpis?.totalProducts ?? 0}`, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Demo Requests', value: stats?.kpis?.totalDemoRequests ?? 0, sub: stats?.kpis?.newDemoRequests > 0 ? `${stats?.kpis?.newDemoRequests} new` : null, color: 'text-cyan-600 dark:text-cyan-400' },
              { label: 'Registered Clients', value: stats?.kpis?.totalCustomers ?? 0, color: 'text-violet-600 dark:text-violet-400' },
            ].map((kpi, idx) => (
              <div key={idx} className="p-4 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 space-y-1 hover:shadow-soft">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">{kpi.label}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</span>
                  {kpi.sub && (
                    <span className="text-[10px] font-bold text-brand-blue dark:text-brand-cyan px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-brand-blue/20">
                      {kpi.sub}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Inquiries and Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Recent Inquiries */}
            <div className="lg:col-span-7 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:shadow-soft">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                  <span>Recent Customer Inquiries</span>
                </h3>
                <button
                  onClick={() => setActiveTab('inquiries')}
                  className="text-xs text-brand-blue dark:text-brand-cyan hover:underline font-semibold"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {!stats?.recentInquiries || stats.recentInquiries.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    No customer inquiries recorded yet.
                  </div>
                ) : (
                  stats.recentInquiries.map((inq) => (
                    <div key={inq.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-blue dark:text-brand-cyan">{inq.inquiryNumber}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent">
                            {inq.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{inq.title}</h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {inq.customer?.name} {inq.customer?.company && `(${inq.customer.company})`}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          handleOpenInquiry(inq);
                          setActiveTab('inquiries');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-transparent transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="lg:col-span-5 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:shadow-soft">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                  <span>Activity Audit Stream</span>
                </h3>
              </div>

              <div className="space-y-3">
                {!stats?.recentActivities || stats.recentActivities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    No recent activity recorded yet.
                  </div>
                ) : (
                  stats.recentActivities.map((act) => (
                    <div key={act.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-blue dark:text-brand-cyan">{act.action}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(act.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Entity: <span className="text-slate-800 dark:text-slate-300 font-mono font-semibold">{act.entityType}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INQUIRIES MANAGEMENT */}
      {activeTab === 'inquiries' && (
        <div
          role="tabpanel"
          id="admin-panel-inquiries"
          aria-labelledby="admin-tab-inquiries"
          tabIndex={0}
          className="space-y-6 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project Inquiries CRM</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Total: {inquiries.length} records</span>
          </div>

          <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Inquiry #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Project Title</th>
                    <th className="py-3 px-4">Budget</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {inquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                        No customer inquiries received yet.
                      </td>
                    </tr>
                  ) : (
                    inquiries.map((inq) => (
                      <tr key={inq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-blue dark:text-brand-cyan">{inq.inquiryNumber}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{inq.customer?.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{inq.customer?.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-200">{inq.title}</td>
                        <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{inq.budget || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {inq.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 flex items-center gap-2">
                          <button
                            onClick={() => handleOpenInquiry(inq)}
                            className="px-3 py-1 rounded-lg bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan hover:bg-brand-blue hover:text-white font-semibold transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => window.open(inquiryApi.getPdfUrl(inq.id), '_blank')}
                            title="Download Spec PDF"
                            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECTS MANAGEMENT */}
      {activeTab === 'projects' && (
        <div
          role="tabpanel"
          id="admin-panel-projects"
          aria-labelledby="admin-tab-projects"
          tabIndex={0}
          className="space-y-6 focus-visible:outline-none"
        >
          <AdminProjectManager />
        </div>
      )}

      {/* TAB: PRODUCTS & SOLUTIONS MANAGEMENT */}
      {activeTab === 'products' && (
        <div
          role="tabpanel"
          id="admin-panel-products"
          aria-labelledby="admin-tab-products"
          tabIndex={0}
          className="space-y-6 focus-visible:outline-none"
        >
          <AdminProductManager />
        </div>
      )}

      {/* TAB 4: CUSTOMERS DIRECTORY */}
      {activeTab === 'customers' && (
        <div
          role="tabpanel"
          id="admin-panel-customers"
          aria-labelledby="admin-tab-customers"
          tabIndex={0}
          className="space-y-6 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Registered Customer Directory</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{customers.length} Customers</span>
          </div>

          <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Inquiries Count</th>
                    <th className="py-3 px-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                        No customer profiles registered yet.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{c.email}</td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{c.company || 'Individual'}</td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{c.phone || 'N/A'}</td>
                        <td className="py-3.5 px-4 font-bold text-brand-blue dark:text-cyan-400 font-mono">{c.inquiries?.length || 0}</td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{new Date(c.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI & TEMPLATES CONFIGURATION */}
      {activeTab === 'ai' && (
        <div
          role="tabpanel"
          id="admin-panel-ai"
          aria-labelledby="admin-tab-ai"
          tabIndex={0}
          className="space-y-8 focus-visible:outline-none"
        >
          {/* AI Engine Live Operational Transparency Card */}
          <div className="max-w-4xl rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Active AI Engine Status & Transparency</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                (liveAiStatus?.status === 'operational' || liveAiStatus?.status === 'connected')
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {liveAiStatus?.status || 'OPERATIONAL'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">1. Active Provider</span>
                <span className="font-bold text-slate-900 dark:text-white capitalize">
                  {liveAiStatus?.provider === 'built-in' ? 'Special Tech Built-In Analyst' : liveAiStatus?.provider === 'gemini' ? 'Google Gemini AI' : 'OpenAI'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">2. Model Name</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {liveAiStatus?.model || aiModel || 'Special Tech NLP v2.0'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">3. External Credentials</span>
                <span className={`font-semibold ${liveAiStatus?.hasExternalCredentials ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {liveAiStatus?.hasExternalCredentials ? 'Configured & Encrypted' : 'Not Configured (Operating on Built-In Analyst)'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">4. Connection Health</span>
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{liveAiStatus?.provider === 'built-in' ? 'Local Engine Operational' : liveAiStatus?.status}</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">5. Last Connection</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {liveAiStatus?.lastConnectedAt ? new Date(liveAiStatus.lastConnectedAt).toLocaleString() : 'Verified Operational'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">6. Last Provider Error</span>
                <span className={`font-mono text-[11px] truncate block ${liveAiStatus?.lastError ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                  {liveAiStatus?.lastError || 'None (All Systems Nominal)'}
                </span>
              </div>
            </div>
          </div>

          {/* Settings & Testing Form */}
          <div className="max-w-4xl rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-8 space-y-6 hover:shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-brand-blue dark:text-brand-cyan uppercase">Model Engine Control</span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Engine & Prototype Settings</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure LLM providers, API keys, and test live AI connectivity.</p>
              </div>

              <button
                type="button"
                onClick={handleTestAIConnection}
                disabled={testingAi}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingAi ? 'animate-spin text-brand-blue' : ''}`} />
                <span>{testingAi ? 'Testing Connection...' : 'Test AI Connection'}</span>
              </button>
            </div>

            {/* Diagnostic Test Result Box */}
            {aiTestResult && (
              <div
                className={`p-5 rounded-2xl border text-xs space-y-3 transition-all ${
                  aiTestResult.status === 'operational'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                    : 'bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-200'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    {aiTestResult.status === 'operational' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>Provider: {aiTestResult.provider?.toUpperCase()} ({aiTestResult.model})</span>
                  </div>
                  {aiTestResult.latencyMs !== undefined && (
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/40 dark:bg-black/30">
                      Response Latency: {aiTestResult.latencyMs}ms
                    </span>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed opacity-90">{aiTestResult.message}</p>

                {aiTestResult.capabilities && (
                  <div className="pt-2 border-t border-emerald-500/20 dark:border-emerald-500/10">
                    <span className="font-bold text-[10px] uppercase tracking-wider block mb-1">Active Capabilities:</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                      {aiTestResult.capabilities.map((cap, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4 text-xs pt-2">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">AI Provider</label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                >
                  <option value="built-in">Special Tech Built-In Intelligent Engine (Heuristic NLP)</option>
                  <option value="gemini">Google Gemini API (1.5 Flash / Pro / 2.0)</option>
                  <option value="openai">OpenAI API (GPT-4o / GPT-4o-mini)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">LLM Model Name</label>
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="gemini-1.5-flash or gpt-4o"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {aiProvider === 'openai' ? 'OpenAI API Key' : 'Gemini API Key'} (Optional)
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Enter API Key to enable live cloud LLM"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  If omitted, Special Tech uses our built-in Software Analyst heuristic engine with full progressive requirement gathering and prototype generation.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveAISettings}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue flex items-center gap-2 hover:opacity-95 transition-opacity"
                >
                  <Save className="w-4 h-4" />
                  <span>Save AI Configuration</span>
                </button>
              </div>
            </div>
          </div>

          {/* Customer AI Discovery Conversations List */}
          <div className="max-w-4xl rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-8 space-y-6 hover:shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Customer AI Discovery Sessions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inspect active and past customer discovery interviews conducted by the AI Project Assistant.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-brand-blue dark:text-brand-cyan">
                {aiConversations.length} Sessions
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden text-xs">
              {aiConversations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No customer AI discovery sessions recorded yet.
                </div>
              ) : (
                aiConversations.map((conv) => (
                  <div key={conv.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{conv.title || 'Untitled Discovery'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-brand-blue dark:text-brand-cyan font-bold">
                          {conv._count?.messages || 0} msgs
                        </span>
                        {conv.requirements?.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Spec Generated
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Client: {conv.customer?.name || 'Anonymous Visitor'} {conv.customer?.email ? `(${conv.customer.email})` : ''} • Session Token: {conv.sessionToken?.slice(0, 14)}...
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenConversation(conv.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-brand-blue dark:text-brand-cyan font-semibold border border-slate-200 dark:border-transparent transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Transcript</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS (EMAIL & SYSTEM CONFIGURATION) */}
      {activeTab === 'settings' && (
        <div
          role="tabpanel"
          id="admin-panel-settings"
          aria-labelledby="admin-tab-settings"
          tabIndex={0}
          className="max-w-4xl space-y-8 focus-visible:outline-none"
        >
          {/* 1. OUTBOUND EMAIL & SMTP NOTIFICATIONS */}
          <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-8 space-y-6 hover:shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-brand-blue dark:text-brand-cyan">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Email & Resend SMTP Service</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure transactional email transport for customer proposal receipts and administrator notifications.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                    smtpStatusData?.lastStatus === 'connected'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : smtpStatusData?.lastStatus === 'error'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      smtpStatusData?.lastStatus === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : smtpStatusData?.lastStatus === 'error'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span>
                    {smtpStatusData?.lastStatus === 'connected'
                      ? 'SMTP CONNECTED'
                      : smtpStatusData?.lastStatus === 'error'
                      ? 'SMTP ERROR'
                      : smtpStatusData?.isConfigured
                      ? 'SMTP CONFIGURED (UNTESTED)'
                      : 'SMTP NOT CONFIGURED'}
                  </span>
                </span>
              </div>
            </div>

            {/* Operational Health Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Host & Port</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {smtpStatusData?.host || 'smtp.resend.com'}:{smtpStatusData?.port || 465}
                </span>
                <span className="text-[10px] text-slate-400 block">{smtpStatusData?.secure ? 'SSL (Secure)' : 'STARTTLS'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Active Sender (From)</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate block">
                  {smtpStatusData?.from || 'Special Tech <info@specialtech.com>'}
                </span>
                <span className="text-[10px] text-slate-400 block">User: {smtpStatusData?.user || 'resend'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Admin Notification Recipient</span>
                <span className="font-semibold text-brand-blue dark:text-brand-cyan truncate block">
                  {smtpStatusData?.adminEmail || 'contact@specialtech.com'}
                </span>
                <span className="text-[10px] text-slate-400 block">Credentials: {smtpStatusData?.hasPass ? '•••••••• (Configured)' : 'None'}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Last Verified Connection</span>
                <span className="font-mono text-slate-900 dark:text-white block">
                  {smtpStatusData?.lastConnectedAt ? new Date(smtpStatusData.lastConnectedAt).toLocaleTimeString() : 'Never'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {smtpStatusData?.lastConnectedAt ? new Date(smtpStatusData.lastConnectedAt).toLocaleDateString() : 'Pending verification'}
                </span>
              </div>
            </div>

            {/* Last Error Notice if any */}
            {smtpStatusData?.lastError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Last SMTP Handshake Error:</strong> {smtpStatusData.lastError}
                </div>
              </div>
            )}

            {/* Last Delivery Status notice */}
            {smtpStatusData?.lastDeliveryStatus && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-brand-blue dark:text-brand-cyan" />
                <div>
                  <strong className="font-bold text-brand-blue dark:text-brand-cyan">Last Delivery Activity:</strong>{' '}
                  {smtpStatusData.lastDeliveryStatus}
                </div>
              </div>
            )}

            {/* SMTP Configuration Form */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  Transport Configuration (Resend SMTP / Custom)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSmtpHost('smtp.resend.com');
                    setSmtpPort('465');
                    setSmtpUser('resend');
                    setSmtpFrom('Special Tech <info@specialtech.com>');
                  }}
                  className="text-[11px] text-brand-blue dark:text-brand-cyan hover:underline font-semibold"
                >
                  Apply Resend SMTP Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">SMTP Host</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.resend.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 font-mono shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">Port</label>
                  <input
                    type="text"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="465 (SSL) or 587 (TLS)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 font-mono shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">SMTP Username</label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="resend"
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 font-mono shadow-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      SMTP Password / API Key
                    </label>
                    {smtpStatusData?.hasPass && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Configured (Saved)
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder={smtpStatusData?.hasPass ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter Resend API Key (re_...)'}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 font-mono shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                    Sender Address (From)
                  </label>
                  <input
                    type="text"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    placeholder="Special Tech <info@specialtech.com>"
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                    Administrator Alert Recipient
                  </label>
                  <input
                    type="email"
                    value={adminEmailNotify}
                    onChange={(e) => setAdminEmailNotify(e.target.value)}
                    placeholder="contact@specialtech.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveSMTPSettings}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue flex items-center gap-2 hover:opacity-95 transition-opacity"
                >
                  <Save className="w-4 h-4" />
                  <span>Save SMTP Configuration</span>
                </button>
              </div>
            </div>

            {/* Test Connection and Send Test Email Actions */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Verification & Test Dispatch
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Live Handshake Test */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <Server className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                      <span>SMTP Handshake Verification</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tests socket authentication with {smtpHost || 'smtp.resend.com'} without dispatching an email.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestSMTPConnection}
                    disabled={testingSmtp}
                    className="w-full py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:border-brand-blue dark:hover:border-cyan-400 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingSmtp ? 'animate-spin' : ''}`} />
                    <span>{testingSmtp ? 'Verifying Socket...' : 'Test SMTP Connection Live'}</span>
                  </button>

                  {smtpTestResult && (
                    <div
                      className={`p-3 rounded-xl text-xs font-mono border ${
                        smtpTestResult.success
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      <div className="font-bold">{smtpTestResult.success ? '✓ Handshake Succeeded' : '✕ Handshake Failed'}</div>
                      <div className="text-[11px] mt-1 break-all">
                        {smtpTestResult.message || smtpTestResult.error}
                        {smtpTestResult.latencyMs && ` (${smtpTestResult.latencyMs}ms)`}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Dispatch Live Test Email */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <Send className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                      <span>Send Real Verification Email</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Dispatches a formatted Special Tech test email to confirm mailbox receipt.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="email"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      placeholder="Recipient email address"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue shadow-sm"
                    />

                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={sendingTestEmail || !testEmailRecipient}
                      className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 ${sendingTestEmail ? 'animate-pulse' : ''}`} />
                      <span>{sendingTestEmail ? 'Sending...' : 'Dispatch Test Email'}</span>
                    </button>
                  </div>

                  {sendTestEmailResult && (
                    <div
                      className={`p-3 rounded-xl text-xs font-mono border ${
                        sendTestEmailResult.success
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      <div className="font-bold">{sendTestEmailResult.success ? '✓ Email Dispatched' : '✕ Delivery Failed'}</div>
                      <div className="text-[11px] mt-1 break-all">
                        {sendTestEmailResult.message || sendTestEmailResult.error}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. COMPANY & SYSTEM IDENTITY SETTINGS */}
          <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-8 space-y-6 hover:shadow-soft">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Company Identity & System Variables</h2>
            <div className="space-y-3">
              {settings.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-brand-blue dark:text-brand-cyan">{s.key}</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {/key|pass|secret|token/i.test(s.key) ? '•••••••••••••••• (Encrypted Secret)' : s.value}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{s.description || 'System Configuration'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div
          role="tabpanel"
          id="admin-panel-logs"
          aria-labelledby="admin-tab-logs"
          tabIndex={0}
          className="space-y-4 focus-visible:outline-none"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security & Audit Activity Logs</h2>
          <div className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden text-xs shadow-sm">
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No security audit logs recorded yet.
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-blue dark:text-brand-cyan">{log.action}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">by {log.user?.name || 'System / Guest'}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">Target Entity: {log.entityType} ({log.entityId || 'N/A'})</div>
                  </div>
                  <span className="font-mono text-slate-500 text-[10px]">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* INQUIRY DETAIL MODAL */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 relative shadow-2xl space-y-6">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-brand-blue dark:text-brand-cyan uppercase">Proposal Record</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedInquiry.inquiryNumber}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{selectedInquiry.title}</p>
            </div>

            {/* Customer Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Customer Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedInquiry.customer?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Email Address:</span>
                <span className="text-brand-blue dark:text-brand-cyan font-mono font-semibold">{selectedInquiry.customer?.email}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Company:</span>
                <span className="text-slate-900 dark:text-white font-medium">{selectedInquiry.customer?.company || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Budget:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{selectedInquiry.budget || 'Unspecified'}</span>
              </div>
            </div>

            {/* Message / Requirements */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Customer Requirements & Notes:</span>
              <p className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {selectedInquiry.message}
              </p>
            </div>

            {/* Generated Prototype Reference */}
            {selectedInquiry.prototypeVersion && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-blue dark:text-brand-cyan">Attached Interactive Prototype</span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Version v{selectedInquiry.prototypeVersion.versionNumber}
                  </span>
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  System: {selectedInquiry.prototypeVersion.prototype?.title || selectedInquiry.prototypeVersion.prototype?.systemType}
                </div>
                {selectedInquiry.prototypeVersion.changeNotes && (
                  <div className="text-[11px] text-slate-500 italic">
                    Change Log: {selectedInquiry.prototypeVersion.changeNotes}
                  </div>
                )}
              </div>
            )}

            {/* AI Discovery Conversation Transcript */}
            {selectedInquiry.requirement?.conversation?.messages?.length > 0 && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    AI Discovery Interview Transcript ({selectedInquiry.requirement.conversation.messages.length} messages)
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {selectedInquiry.requirement.conversation.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-lg text-[11px] leading-relaxed ${
                        m.sender === 'USER'
                          ? 'bg-blue-600 text-white ml-6'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-6 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-[9px] uppercase tracking-wider mb-0.5 opacity-70">
                        {m.sender === 'USER' ? 'Customer' : 'Special Tech AI Analyst'}
                      </div>
                      <div className="whitespace-pre-line">{m.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status & Actions */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Update Inquiry Status:</span>
              <div className="flex flex-wrap gap-2">
                {['NEW', 'UNDER_REVIEW', 'ESTIMATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, st, selectedInquiry.internalNotes)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${
                      selectedInquiry.status === st
                        ? 'bg-brand-blue text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => window.open(inquiryApi.getPdfUrl(selectedInquiry.id), '_blank')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-blue"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Specification PDF</span>
              </button>

              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-transparent transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONVERSATION TRANSCRIPT MODAL */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 relative shadow-2xl space-y-6">
            <button
              onClick={() => setSelectedConversation(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-brand-blue dark:text-brand-cyan uppercase">Discovery Session Transcript</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedConversation.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Session Token: {selectedConversation.sessionToken} • Started: {new Date(selectedConversation.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Customer Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedConversation.customer?.name || 'Anonymous Visitor'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Customer Email:</span>
                <span className="text-brand-blue dark:text-brand-cyan font-mono font-semibold">{selectedConversation.customer?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Prototypes Created:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedConversation.prototypes?.length || 0}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Message Exchange:</span>
              <div className="max-h-80 overflow-y-auto space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {selectedConversation.messages?.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      m.sender === 'USER'
                        ? 'bg-blue-600 text-white ml-8 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-8 border border-slate-200 dark:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="font-bold text-[9px] uppercase tracking-wider mb-1 opacity-70">
                      {m.sender === 'USER' ? 'Customer' : 'Special Tech AI Business Analyst'}
                    </div>
                    <div className="whitespace-pre-line">{m.content}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedConversation(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboardPage;

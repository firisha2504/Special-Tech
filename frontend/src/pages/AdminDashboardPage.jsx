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
  const [loginEmail, setLoginEmail] = useState('admin@specialtech.com');
  const [loginPassword, setLoginPassword] = useState('Admin@123456');
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

  // AI Settings state
  const [aiProvider, setAiProvider] = useState('built-in');
  const [geminiKey, setGeminiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');

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

  const handleSaveAISettings = async () => {
    try {
      await adminApi.updateSetting({ key: 'ai_provider', value: aiProvider });
      await adminApi.updateSetting({ key: 'ai_model', value: aiModel });
      if (geminiKey.trim()) {
        await adminApi.updateSetting({ key: 'gemini_api_key', value: geminiKey.trim() });
      }
      alert('AI Configuration saved successfully to database!');
      loadDashboardData();
    } catch (err) {
      alert('Failed to save AI settings');
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan text-sm shadow-sm"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">Default System Credentials:</span>
              <div>Email: <code className="text-brand-blue dark:text-cyan-400 font-bold font-mono">admin@specialtech.com</code></div>
              <div>Password: <code className="text-brand-blue dark:text-cyan-400 font-bold font-mono">Admin@123456</code></div>
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
                {stats?.recentInquiries?.map((inq) => (
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
                        setSelectedInquiry(inq);
                        setActiveTab('inquiries');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-transparent transition-colors"
                    >
                      Manage
                    </button>
                  </div>
                ))}
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
                {stats?.recentActivities?.map((act) => (
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
                ))}
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
                  {inquiries.map((inq) => (
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
                          onClick={() => setSelectedInquiry(inq)}
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
                  ))}
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
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{c.email}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{c.company || 'Individual'}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{c.phone || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-bold text-brand-blue dark:text-cyan-400 font-mono">{c.inquiries?.length || 0}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
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
          className="max-w-3xl rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-8 space-y-6 hover:shadow-soft focus-visible:outline-none"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-brand-blue dark:text-brand-cyan uppercase">Model Engine Control</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Engine & Prototype Settings</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure LLM providers, API keys, and prototype templates.</p>
          </div>

          <div className="space-y-4 text-xs pt-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">AI Provider</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
              >
                <option value="built-in">Special Tech Built-In Intelligent Engine</option>
                <option value="gemini">Google Gemini API (1.5 Flash / Pro)</option>
                <option value="openai">OpenAI API (GPT-4o)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">LLM Model Name</label>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                placeholder="gemini-1.5-flash"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Gemini / OpenAI API Key (Optional)
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter AI API Key to enable live cloud LLM"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                If omitted, the platform uses our built-in Software Analyst NLP engine with full specification and prototype generation.
              </span>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveAISettings}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save AI Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && (
        <div
          role="tabpanel"
          id="admin-panel-settings"
          aria-labelledby="admin-tab-settings"
          tabIndex={0}
          className="max-w-3xl rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-8 space-y-6 hover:shadow-soft focus-visible:outline-none"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Company & System Settings</h2>
          <div className="space-y-3">
            {settings.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-mono font-bold text-brand-blue dark:text-brand-cyan">{s.key}</div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">{s.key.includes('key') ? '••••••••••••' : s.value}</div>
                </div>
                <span className="text-[10px] text-slate-500">{s.description}</span>
              </div>
            ))}
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
            {activityLogs.map((log) => (
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
            ))}
          </div>
        </div>
      )}

      {/* INQUIRY DETAIL MODAL */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 relative shadow-2xl space-y-6">
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
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
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
    </AdminLayout>
  );
};

export default AdminDashboardPage;

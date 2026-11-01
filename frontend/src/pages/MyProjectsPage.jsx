import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bell,
  Check,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Calendar,
  RefreshCw,
  LogOut,
  Mail,
  User,
  Building,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  Award,
  Trash2,
  Eye,
  Sliders,
  CheckCheck,
} from 'lucide-react';
import { customerApi } from '../services/api';

const STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    bar: 'bg-amber-500',
    icon: Clock,
    description: 'Initial intake received. Engineering scope and architectural planning in progress.',
  },
  Approved: {
    label: 'Approved',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    bar: 'bg-blue-500',
    icon: CheckCircle2,
    description: 'Project approved for active development. Sprint timeline and resources committed.',
  },
  'In Progress': {
    label: 'In Progress',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    bar: 'bg-gradient-to-r from-blue-500 to-cyan-400',
    icon: RefreshCw,
    description: 'Active design, coding, database integration, and feature development ongoing.',
  },
  'Under Review': {
    label: 'Under Review',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    bar: 'bg-purple-500',
    icon: Layers,
    description: 'Milestone deliverables deployed for QA testing, security review, and client feedback.',
  },
  'Revision Required': {
    label: 'Revision Required',
    badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    bar: 'bg-orange-500',
    icon: AlertCircle,
    description: 'Revisions requested. Development team is applying required modifications.',
  },
  Completed: {
    label: 'Completed',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    bar: 'bg-emerald-500',
    icon: Award,
    description: 'Project deliverables completed, tested, verified, and handed over.',
  },
  Cancelled: {
    label: 'Cancelled',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    bar: 'bg-rose-500',
    icon: AlertCircle,
    description: 'Project lifecycle has been cancelled or archived.',
  },
};

export const MyProjectsPage = () => {
  const [customer, setCustomer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'notifications'
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await customerApi.getProfile();
      if (res.data?.success && res.data?.data) {
        setCustomer(res.data.data);
        await Promise.all([
          loadProjects(),
          loadNotifications(),
        ]);
      } else {
        localStorage.removeItem('customer_token');
      }
    } catch (err) {
      localStorage.removeItem('customer_token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await customerApi.login({ email: loginEmail.trim() });
      if (res.data?.success && res.data?.data) {
        localStorage.setItem('customer_token', res.data.data.token);
        setCustomer(res.data.data.customer);
        await Promise.all([
          loadProjects(),
          loadNotifications(),
        ]);
      }
    } catch (err) {
      setLoginError(
        err.response?.data?.message || 'Customer account not found with this email. Please ensure your inquiry or project email is registered.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    setCustomer(null);
    setProjects([]);
    setNotifications([]);
    setSelectedProject(null);
  };

  const loadProjects = async () => {
    try {
      const res = await customerApi.getProjects();
      if (res.data?.success) {
        setProjects(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load customer projects', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await customerApi.getNotifications();
      if (res.data?.success) {
        const notifs = res.data.data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to load customer notifications', err);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await customerApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await customerApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await customerApi.deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleOpenDetailModal = (proj) => {
    setSelectedProject(proj);
    setIsDetailModalOpen(true);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (notificationFilter === 'UNREAD') return !n.isRead;
    return true;
  });

  // Not logged in view: Customer Portal Login
  if (!customer && !loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 bg-slate-50 dark:bg-[#020B18] flex items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
                <FolderKanban className="w-8 h-8 text-cyan-500" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Customer Project Portal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Access your real-time project status, milestone progress, and automated delivery notifications.
            </p>
          </div>

          {loginError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Customer Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. client@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-brand-blue/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Client Access...</span>
                </>
              ) : (
                <>
                  <span>Access My Projects</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400">
              Need assistance with your customer account?{' '}
              <Link to="/contact" className="text-cyan-500 hover:underline font-semibold">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#020B18]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Customer Portal Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-md shadow-brand-blue/20">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-lg text-cyan-500">
                {customer?.name?.charAt(0) || 'C'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome, {customer?.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  Client Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                <span>{customer?.email}</span>
                {customer?.company && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      {customer.company}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3 self-end md:self-center">
            {/* Notification Bell Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Status Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-rose-500 text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Panel */}
              {showNotificationMenu && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Status Notifications</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-mono">
                        {unreadCount} Unread
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet. You will be automatically notified here when project statuses are updated.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                          className={`p-3 text-xs transition-colors cursor-pointer flex items-start gap-3 ${
                            n.isRead
                              ? 'bg-transparent text-slate-500'
                              : 'bg-cyan-50/50 dark:bg-cyan-950/20 text-slate-900 dark:text-white font-medium'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              n.isRead ? 'bg-transparent' : 'bg-cyan-500'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-slate-900 dark:text-white leading-snug">
                              {n.title}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              {new Date(n.createdAt).toLocaleDateString()} at{' '}
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteNotification(n.id, e)}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-950/50">
                    <button
                      onClick={() => {
                        setShowNotificationMenu(false);
                        setActiveTab('notifications');
                      }}
                      className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                loadProjects();
                loadNotifications();
              }}
              title="Refresh projects & notifications"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-blue-600 text-white shadow-md shadow-brand-blue/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            My Active Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-md shadow-brand-blue/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Status Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: PROJECTS VIEW */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {projects.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Active Projects Found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  You currently do not have any commissioned projects associated with this customer account. Once your proposal or project is approved, it will appear here with live tracking.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-blue-500 transition-colors"
                >
                  Commission New Project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {projects.map((proj) => {
                  const statusConf = STATUS_CONFIG[proj.status] || STATUS_CONFIG.Pending;
                  const StatusIcon = statusConf.icon;
                  const isCompleted = proj.status === 'Completed';

                  return (
                    <div
                      key={proj.id}
                      className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Top Bar: Title, Status Badge, Last Updated */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                              {proj.title}
                            </h2>
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConf.badge}`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span>{statusConf.label}</span>
                            </span>
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                                <Award className="w-3.5 h-3.5" />
                                <span>Verified & Delivered</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {proj.shortDesc || proj.description || 'Special Tech engineering deliverable.'}
                          </p>
                        </div>

                        <div className="text-left sm:text-right flex-shrink-0">
                          <div className="text-[11px] text-slate-400 font-mono">
                            Last Updated:{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {new Date(proj.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Category: {proj.category}
                          </div>
                        </div>
                      </div>

                      {/* COMPLETED CELEBRATION BANNER */}
                      {isCompleted && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 border border-emerald-500/30 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                              <span>🎉 Project Successfully Completed & Delivered!</span>
                            </div>
                            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80 mt-0.5 leading-relaxed">
                              All engineering deliverables, test suites, architecture schemas, and production deployments have been verified and finalized. Thank you for partnering with Special Tech!
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar & Percentage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-cyan-500" />
                            <span>Milestone Progress</span>
                          </span>
                          <span className="font-mono font-black text-sm text-cyan-600 dark:text-cyan-400">
                            {proj.progress ?? 0}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${statusConf.bar}`}
                            style={{ width: `${Math.min(100, Math.max(0, proj.progress ?? 0))}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          {statusConf.description}
                        </p>
                      </div>

                      {/* History & Status Transitions Preview */}
                      {proj.statusHistory && proj.statusHistory.length > 0 && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-brand-blue" />
                            <span>Recent Status Updates</span>
                          </div>
                          <div className="space-y-2">
                            {proj.statusHistory.slice(0, 3).map((hist) => (
                              <div
                                key={hist.id}
                                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-[10px] text-slate-400">
                                      {hist.previousStatus ? `${hist.previousStatus} → ` : ''}
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {hist.newStatus}
                                    </span>
                                    {hist.changedBy?.name && (
                                      <span className="text-[10px] text-slate-400">
                                        by {hist.changedBy.name}
                                      </span>
                                    )}
                                  </div>
                                  {hist.message && (
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                      "{hist.message}"
                                    </p>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap self-start sm:self-auto">
                                  {new Date(hist.createdAt).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          {proj.demoUrl && (
                            <a
                              href={proj.demoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-500 text-xs font-semibold transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Live Preview</span>
                            </a>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenDetailModal(proj)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-brand-blue/20 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Project Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NOTIFICATIONS VIEW */}
        {activeTab === 'notifications' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Notification Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNotificationFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    notificationFilter === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotificationFilter('UNREAD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    notificationFilter === 'UNREAD'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark All as Read</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Bell className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-700" />
                  <p>No notifications matching this filter.</p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 sm:p-5 transition-colors flex items-start gap-4 ${
                      n.isRead
                        ? 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        : 'bg-cyan-50/40 dark:bg-cyan-950/20 text-slate-900 dark:text-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        n.isRead
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {n.title}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString()} at{' '}
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      {n.project && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                          <FolderKanban className="w-3 h-3" />
                          <span>{n.project.title}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-center">
                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          title="Mark as Read"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(n.id, e)}
                        title="Delete Notification"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL: VIEW PROJECT DETAILS & COMPLETE HISTORY TIMELINE */}
      {isDetailModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {selectedProject.title}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${
                      STATUS_CONFIG[selectedProject.status]?.badge || STATUS_CONFIG.Pending.badge
                    }`}
                  >
                    <span>{selectedProject.status}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Category: {selectedProject.category} • Client: {selectedProject.clientName || customer?.name}
                </p>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Description & Overview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                Scope & Specifications
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedProject.description || selectedProject.shortDesc || 'No extended description recorded.'}
              </p>
            </div>

            {/* Technologies */}
            {selectedProject.technologies && selectedProject.technologies.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                  Engineered Tech Stack
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.technologies.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Complete Project Status History Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>Status Change Audit History</span>
              </h4>

              {selectedProject.statusHistory && selectedProject.statusHistory.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {selectedProject.statusHistory.map((hist) => (
                    <div key={hist.id} className="relative space-y-1">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-white dark:border-slate-900" />
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Status changed to {hist.newStatus}
                        </span>
                        {hist.previousStatus && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            (was {hist.previousStatus})
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {new Date(hist.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {hist.message && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                          {hist.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No historical status changes recorded yet. Initial status: {selectedProject.status}.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjectsPage;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { adminApi } from '../../services/api';
import {
  Menu,
  Sun,
  Moon,
  RefreshCw,
  Bell,
  ChevronRight,
  Shield,
  PanelLeftClose,
  PanelLeft,
  ExternalLink,
  Inbox,
  Package,
  Check,
  CheckCheck,
  Trash2,
  X,
  AlertTriangle,
  Clock,
  Filter,
  Loader2,
  Sparkles,
  CheckCircle2,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export const AdminHeader = ({
  activeTabTitle,
  activeTabId,
  stats,
  loading = false,
  onRefresh,
  onOpenMobileSidebar,
  isSidebarCollapsed,
  onToggleCollapse,
  user,
  onLogout,
  onSelectTab,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const popoverRef = useRef(null);
  const accountMenuRef = useRef(null);

  // Account Menu State
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Notification States
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setNotifLoading(true);
    try {
      const res = await adminApi.getNotifications({ limit: 50 });
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        if (typeof res.data.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        }
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      if (!silent) setNotifLoading(false);
    }
  }, []);

  // Periodic polling for real-time notification arrivals and tab focus sync
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 20000);

    const handleFocus = () => fetchNotifications(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNotifications]);

  // Close notification dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    if (notificationsOpen || accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen, accountMenuOpen]);

  // Format relative timestamp
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation?.();
    setActionLoadingId(id);

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await adminApi.markNotificationRead(id);
      if (typeof res.data?.unreadCount === 'number') {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
      fetchNotifications(true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await adminApi.markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
      fetchNotifications(true);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Delete notification
  const handleDelete = async (id, e) => {
    e?.stopPropagation?.();
    setActionLoadingId(id);

    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      const res = await adminApi.deleteNotification(id);
      if (typeof res.data?.unreadCount === 'number') {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      fetchNotifications(true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Clear all read notifications
  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    try {
      await adminApi.clearReadNotifications();
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
      fetchNotifications(true);
    }
  };

  // Click on a notification item: mark as read and navigate
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    setNotificationsOpen(false);

    if (notification.link) {
      if (notification.link.includes('tab=inquiries') && onSelectTab) {
        onSelectTab('inquiries');
      } else if (notification.link.includes('tab=products') && onSelectTab) {
        onSelectTab('products');
      } else if (notification.link.startsWith('/admin/inquiries') && onSelectTab) {
        onSelectTab('inquiries');
      } else {
        navigate(notification.link);
      }
    }
  };

  // Filtered notifications calculation
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const readCount = notifications.filter((n) => n.isRead).length;

  // Icon resolver per notification category
  const renderTypeIcon = (type) => {
    switch (type) {
      case 'inquiry':
        return (
          <div className="p-2 rounded-xl bg-blue-500/10 text-brand-blue dark:text-brand-cyan flex-shrink-0">
            <Inbox className="w-4 h-4" />
          </div>
        );
      case 'demo_request':
        return (
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex-shrink-0">
            <Package className="w-4 h-4" />
          </div>
        );
      case 'security':
        return (
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
            <Shield className="w-4 h-4" />
          </div>
        );
      case 'alert':
        return (
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex-shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex-shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full flex items-center justify-between px-4 sm:px-6 bg-white/90 dark:bg-[#020D20]/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 transition-colors">
      {/* Left: Mobile Menu Toggle, Desktop Collapse, and Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Collapse/Expand Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Current Breadcrumb & Title */}
        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline font-medium">
            Admin Portal
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hidden sm:inline flex-shrink-0" />
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
            {activeTabTitle || 'Overview'}
          </h1>
        </div>
      </div>

      {/* Right Controls: Sync, Refresh, Notifications, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Live Sync Status */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PostgreSQL Live</span>
        </div>

        {/* Refresh Data Button */}
        <button
          type="button"
          onClick={() => {
            if (onRefresh) onRefresh();
            fetchNotifications(false);
          }}
          disabled={loading}
          title="Refresh Dashboard Data"
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-blue' : ''}`} />
          <span className="hidden md:inline">Refresh</span>
        </button>

        {/* Notifications Popover Menu */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              if (!notificationsOpen) fetchNotifications(true);
            }}
            title="Notifications"
            className={`p-2 rounded-xl border transition-colors relative shadow-xs cursor-pointer ${
              notificationsOpen
                ? 'border-brand-blue/50 bg-blue-50/50 dark:bg-blue-950/30 text-brand-blue dark:text-brand-cyan'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold font-mono bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Professional Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2.5 w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] rounded-3xl bg-white dark:bg-[#061226] border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col animate-fadeIn">
              {/* Top Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan border border-brand-blue/20">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0 || isMarkingAll}
                    title="Mark all notifications as read"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue dark:text-brand-cyan hover:underline disabled:opacity-40 disabled:hover:no-underline cursor-pointer transition-opacity"
                  >
                    {isMarkingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Mark all read</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filters Tabs: All, Unread, Read */}
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#061226] flex items-center gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    filter === 'unread'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-brand-blue text-white text-[9px] font-mono flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('read')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    filter === 'read'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Read ({readCount})
                </button>
              </div>

              {/* Notification List Scroll Area */}
              <div className="max-h-[380px] sm:max-h-[440px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifLoading && notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
                    <span>Loading notifications...</span>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="py-12 px-6 flex flex-col items-center justify-center text-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                      {filter === 'unread'
                        ? 'All caught up!'
                        : filter === 'read'
                        ? 'No read notifications'
                        : 'No notifications'}
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      {filter === 'unread'
                        ? 'There are no unread notifications waiting for your review.'
                        : filter === 'read'
                        ? 'Items you mark as read will be archived here.'
                        : 'System alerts, customer proposals, and SaaS demo requests will appear here.'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((n) => {
                    const isUnread = !n.isRead;
                    const isBusy = actionLoadingId === n.id;

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 transition-colors relative group cursor-pointer flex items-start gap-3 ${
                          isUnread
                            ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Type Icon */}
                        {renderTypeIcon(n.type)}

                        {/* Text and Actions */}
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`text-xs truncate ${
                                isUnread
                                  ? 'font-bold text-slate-900 dark:text-white'
                                  : 'font-semibold text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {n.title}
                            </h4>

                            {/* Unread Indicator Pulse Dot */}
                            {isUnread && (
                              <span
                                title="Unread notification"
                                className="w-2 h-2 rounded-full bg-brand-blue flex-shrink-0 animate-pulse"
                              />
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60 dark:border-slate-800/40 text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(n.createdAt)}</span>
                            </span>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              {isUnread && (
                                <button
                                  type="button"
                                  onClick={(e) => handleMarkAsRead(n.id, e)}
                                  disabled={isBusy}
                                  title="Mark as Read"
                                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  {isBusy ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Check className="w-2.5 h-2.5" />
                                  )}
                                  <span>Read</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleDelete(n.id, e)}
                                disabled={isBusy}
                                title="Delete notification"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Footer */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  {filteredNotifications.length} of {notifications.length} shown
                </span>

                {readCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRead}
                    className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer font-medium"
                  >
                    Clear read history
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme mode"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-cyan hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-blue" />}
        </button>

        {/* User Account Menu Dropdown */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => {
              setAccountMenuOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer group"
            title="Administrator Account Menu"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'Admin'}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-blue to-cyan-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left max-w-[130px]">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                <Shield className={`w-2.5 h-2.5 ${user?.isSuperAdmin ? 'text-amber-400' : 'text-brand-blue dark:text-brand-cyan'}`} />
                <span className={user?.isSuperAdmin ? 'text-amber-500 font-semibold' : ''}>
                  {user?.isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Account Menu Popover */}
          {accountMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profile Card Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="flex items-center gap-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'Admin'}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand-blue/30 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-cyan-400 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user?.name || 'Administrator'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.email || 'admin@specialtech.com'}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan">
                      <Shield className="w-2.5 h-2.5" />
                      <span>{user?.isSuperAdmin ? 'Super Administrator' : 'Administrator'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Links */}
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    if (onSelectTab) onSelectTab('profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:text-brand-blue dark:hover:text-brand-cyan hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
                >
                  <User className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    if (onSelectTab) onSelectTab('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:text-brand-blue dark:hover:text-brand-cyan hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account & System Settings</span>
                </button>
              </div>

              {/* Logout Footer */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

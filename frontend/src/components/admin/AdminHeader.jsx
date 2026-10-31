import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Menu,
  Sun,
  Moon,
  RefreshCw,
  Bell,
  Search,
  ChevronRight,
  Shield,
  PanelLeftClose,
  PanelLeft,
  ExternalLink,
  Inbox,
  Package,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const totalNotifications =
    (stats?.kpis?.newInquiries || 0) + (stats?.kpis?.newDemoRequests || 0);

  return (
    <header className="sticky top-0 z-30 h-16 w-full flex items-center justify-between px-4 sm:px-6 bg-white/90 dark:bg-[#020D20]/90 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 transition-colors">
      {/* Left: Mobile Menu Toggle, Desktop Collapse, and Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Collapse/Expand Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Dashboard Data"
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-blue' : ''}`} />
          <span className="hidden md:inline">Refresh</span>
        </button>

        {/* Notifications Popover Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notifications"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative shadow-xs"
          >
            <Bell className="w-4 h-4" />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xs">
                {totalNotifications}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Admin Notifications</span>
                <span className="text-[10px] font-mono text-brand-blue dark:text-brand-cyan font-bold">
                  {totalNotifications} New
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {stats?.kpis?.newInquiries > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectTab) onSelectTab('inquiries');
                      setNotificationsOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 hover:border-brand-blue/40 flex items-center gap-3 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-brand-blue/10 text-brand-blue dark:text-brand-cyan">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {stats.kpis.newInquiries} New Project Inquiry
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Review customer specs & proposals
                      </div>
                    </div>
                  </button>
                )}

                {stats?.kpis?.newDemoRequests > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectTab) onSelectTab('products');
                      setNotificationsOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/40 hover:border-brand-cyan/40 flex items-center gap-3 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-brand-cyan">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {stats.kpis.newDemoRequests} New Demo Request
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        SaaS product demo schedule requests
                      </div>
                    </div>
                  </button>
                )}

                {totalNotifications === 0 && (
                  <div className="py-4 text-center text-slate-400 dark:text-slate-500 text-xs">
                    All notifications resolved
                  </div>
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
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-cyan hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-blue" />}
        </button>

        {/* User Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-blue to-cyan-400 text-white font-bold text-xs flex items-center justify-center">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
            {user?.name || 'Alexander Wright'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

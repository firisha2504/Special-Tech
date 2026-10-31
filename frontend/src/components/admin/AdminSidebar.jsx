import React from 'react';
import Logo from '../common/Logo';
import SidebarNavItem from './SidebarNavItem';
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  Package,
  Users,
  Cpu,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const NAV_GROUPS = [
  {
    group: 'OVERVIEW',
    items: [
      { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    group: 'MANAGEMENT',
    items: [
      { id: 'inquiries', name: 'Inquiries & Proposals', icon: Inbox, countKey: 'newInquiries' },
      { id: 'projects', name: 'Portfolio Projects', icon: Briefcase },
      { id: 'products', name: 'Products & Solutions', icon: Package, countKey: 'newDemoRequests' },
      { id: 'customers', name: 'Customer Directory', icon: Users },
    ],
  },
  {
    group: 'AI PLATFORM',
    items: [
      { id: 'ai', name: 'AI & Templates', icon: Cpu },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { id: 'logs', name: 'Audit Logs', icon: History },
      { id: 'settings', name: 'Settings', icon: Settings },
    ],
  },
];

export const AdminSidebar = ({
  activeTab,
  onSelectTab,
  stats,
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  user,
  onLogout,
}) => {
  const handleItemClick = (id) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const getBadgeCount = (countKey) => {
    if (!countKey || !stats?.kpis) return 0;
    return stats.kpis[countKey] || 0;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          role="presentation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="Admin Sidebar Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out bg-white dark:bg-[#020D20] border-r border-slate-200/90 dark:border-slate-800/80 shadow-xs select-none ${
          /* Desktop Width */
          isCollapsed ? 'lg:w-20' : 'lg:w-[260px]'
        } ${
          /* Mobile Drawer: Translate in from left */
          mobileOpen
            ? 'translate-x-0 w-[270px] max-w-[85vw]'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: Brand & Controls */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/90 dark:border-slate-800/80 flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {isCollapsed ? (
              <div className="w-full flex justify-center">
                <Logo variant="icon" size="sm" showLink={false} />
              </div>
            ) : (
              <div className="flex flex-col min-w-0">
                <Logo variant="horizontal" size="sm" showLink={false} />
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-brand-blue dark:text-brand-cyan pl-0.5 mt-0.5">
                  Admin Control Center
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            title="Close navigation"
            className="flex lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={group.group} className="space-y-1">
              {/* Group Title (Hidden when collapsed) */}
              {!isCollapsed ? (
                <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  {group.group}
                </div>
              ) : (
                gIdx > 0 && <div className="my-2 border-t border-slate-100 dark:border-slate-800/80 mx-2" />
              )}

              {/* Group Items */}
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  isCollapsed={isCollapsed}
                  badgeCount={getBadgeCount(item.countKey)}
                  onClick={() => handleItemClick(item.id)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Public Website Shortcut Button */}
        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/60">
          <Link
            to="/"
            title="View Live Public Website"
            className={`w-full flex items-center text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-cyan hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
            }`}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="truncate">View Live Website</span>}
          </Link>
        </div>

        {/* User Profile Footer Section */}
        <div className="p-3 border-t border-slate-200/90 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex-shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-2.5'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {/* User Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-blue to-cyan-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>

              {/* User Info (when expanded) */}
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-brand-blue dark:text-brand-cyan" />
                    <span>Administrator</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out of Admin Portal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;

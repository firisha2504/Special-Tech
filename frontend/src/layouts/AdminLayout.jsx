import React, { useState, useEffect } from 'react';
import AdminSidebar, { NAV_GROUPS } from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';

export const AdminLayout = ({
  activeTab,
  onSelectTab,
  stats,
  loading = false,
  onRefresh,
  user,
  onLogout,
  children,
}) => {
  // Desktop collapsed sidebar state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('special_tech_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Toggle desktop collapsed mode
  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('special_tech_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Close mobile drawer on route/tab change or Esc key
  useEffect(() => {
    setMobileOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // Find active tab title
  let activeTabTitle = 'Overview';
  for (const group of NAV_GROUPS) {
    const match = group.items.find((item) => item.id === activeTab);
    if (match) {
      activeTabTitle = match.name;
      break;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#020D20] text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden">
      {/* Vertical Sidebar (Desktop + Mobile Drawer) */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        stats={stats}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Body Area: Automatically padded for sidebar width on desktop */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-[260px]'
        }`}
      >
        {/* Top Header */}
        <AdminHeader
          activeTabTitle={activeTabTitle}
          activeTabId={activeTab}
          stats={stats}
          loading={loading}
          onRefresh={onRefresh}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          isSidebarCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          user={user}
          onLogout={onLogout}
          onSelectTab={onSelectTab}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

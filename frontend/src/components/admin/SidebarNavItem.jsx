import React from 'react';

export const SidebarNavItem = ({
  item,
  isActive,
  isCollapsed,
  badgeCount = 0,
  onClick,
}) => {
  const Icon = item.icon;

  return (
    <button
      type="button"
      id={`admin-nav-${item.id}`}
      onClick={onClick}
      title={isCollapsed ? item.name : undefined}
      className={`group relative w-full flex items-center transition-all duration-200 ease-out font-medium text-xs rounded-xl select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
        isCollapsed
          ? 'justify-center p-2.5 my-1'
          : 'gap-3 px-3.5 py-2.5 my-0.5'
      } ${
        isActive
          ? 'bg-gradient-to-r from-[#087BFF] to-[#08D9E8] text-white shadow-md shadow-brand-blue/25 dark:shadow-glow-cyan/20 ring-1 ring-white/20 font-semibold'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/70 border border-transparent'
      }`}
    >
      {/* Icon */}
      <Icon
        className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
          isActive
            ? 'text-white drop-shadow-xs'
            : 'text-slate-400 dark:text-slate-500 group-hover:text-brand-blue dark:group-hover:text-brand-cyan'
        }`}
      />

      {/* Label and Badge (when expanded) */}
      {!isCollapsed && (
        <>
          <span className="truncate flex-1 text-left tracking-tight">
            {item.name}
          </span>

          {badgeCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none transition-colors ${
                isActive
                  ? 'bg-white/25 text-white'
                  : 'bg-brand-blue/10 dark:bg-brand-cyan/15 text-brand-blue dark:text-brand-cyan group-hover:bg-brand-blue/20'
              }`}
            >
              {badgeCount}
            </span>
          )}
        </>
      )}

      {/* Dot indicator when collapsed and has badge */}
      {isCollapsed && badgeCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-white dark:ring-slate-900" />
      )}
    </button>
  );
};

export default SidebarNavItem;

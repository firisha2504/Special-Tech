import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export const Logo = ({
  variant = 'horizontal', // 'horizontal' | 'full' | 'icon'
  size = 'md',            // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  showLink = true,
}) => {
  const { isDark } = useTheme();

  // Responsive sizing classes preserving natural aspect ratio
  const heightClasses = {
    sm: variant === 'icon' ? 'h-7 w-7' : 'h-8',
    md: variant === 'icon' ? 'h-9 w-9' : 'h-9 sm:h-10',
    lg: variant === 'icon' ? 'h-12 w-12' : 'h-12 sm:h-14',
    xl: variant === 'icon' ? 'h-16 w-16' : 'h-16 sm:h-20',
  };

  const getLogoSrc = () => {
    if (variant === 'icon') {
      return '/logo/special-tech-icon.png';
    }
    if (variant === 'full') {
      return '/logo/special-tech-logo.png';
    }
    // Default horizontal logo
    return '/logo/special-tech-horizontal.png';
  };

  // In light theme, wrap the official dark-background logo in a subtle container
  // to ensure maximum contrast and preservation of the original white/cyan branding
  const containerStyle = !isDark
    ? 'bg-[#020D20] px-2.5 py-1 rounded-xl border border-brand-cardBorder/30 shadow-md'
    : '';

  const content = (
    <div
      className={`inline-flex items-center justify-center select-none group transition-all duration-200 ${containerStyle} ${className}`}
    >
      <img
        src={getLogoSrc()}
        alt="SPECIAL TECH - Innovation • Intelligence • Solutions"
        className={`${heightClasses[size] || 'h-10'} w-auto max-w-full object-contain transition-transform group-hover:scale-[1.02] duration-200 rounded-md`}
        loading="eager"
      />
    </div>
  );

  if (showLink) {
    return (
      <Link
        to="/"
        aria-label="Special Tech Homepage"
        className="inline-block focus:outline-none focus:ring-2 focus:ring-brand-blue/50 rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;

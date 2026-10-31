import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Logo from './Logo';
import { Moon, Sun, Sparkles, Menu, X, ArrowRight, Shield } from 'lucide-react';

export const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Projects', path: '/projects' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'py-3 bg-white/95 dark:bg-[#020D20]/95 backdrop-blur-md border-b border-slate-200 dark:border-brand-cardBorder/30 shadow-md'
          : 'py-4 sm:py-5 bg-white/80 dark:bg-[#020D20]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo variant="horizontal" size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'text-brand-blue dark:text-brand-cyan bg-blue-50 dark:bg-brand-cyan/10 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-brand-blue dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Actions: Theme Toggle + CTA Button */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Admin Link Icon */}
            <Link
              to="/admin"
              title="Admin Portal"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <Shield className="w-4 h-4" />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme mode"
              className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-brand-blue dark:hover:text-brand-cyan hover:border-brand-blue/40 dark:hover:border-brand-cyan/50 shadow-sm transition-all duration-200"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-blue" />}
            </button>

            {/* Main CTA: Build Your Idea with AI */}
            <Link
              to="/ai-assistant"
              id="nav-cta-ai"
              className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-brand-blue to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-glow-blue transition-all duration-300 hover:scale-105 group active:scale-95"
            >
              <Sparkles className="w-4 h-4 animate-spin-slow text-cyan-200" />
              <span>Build Your Idea with AI</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-blue" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 dark:bg-[#07172E]/98 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 mt-3 space-y-2 shadow-2xl animate-fadeIn">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-base ${
                  isActive
                    ? 'text-brand-blue dark:text-brand-cyan bg-blue-50 dark:bg-brand-cyan/10 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:text-brand-blue dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <Link
              to="/ai-assistant"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-glow-blue"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Build Your Idea with AI</span>
            </Link>
            <Link
              to="/admin"
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Management</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

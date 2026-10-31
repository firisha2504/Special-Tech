import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Sparkles, Mail, Phone, MapPin, ArrowRight, Globe } from 'lucide-react';

const GithubIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#020D20] text-slate-600 dark:text-slate-300 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 xl:gap-10">
          {/* Brand Info */}
          <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2 space-y-4">
            <Logo variant="horizontal" size="md" />
            <p className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-wider uppercase">
              Innovation • Intelligence • Solutions
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm leading-relaxed">
              We transform your ideas and business challenges into powerful digital solutions. Tell us what you need, and our AI helps you visualize your next software project.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://github.com/specialtech"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-cyan hover:scale-105 transition-all"
              >
                <GithubIcon />
              </a>
              <a
                href="https://linkedin.com/company/specialtech"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-cyan hover:scale-105 transition-all"
              >
                <LinkedinIcon />
              </a>
              <a
                href="https://twitter.com/specialtech"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-cyan hover:scale-105 transition-all"
              >
                <TwitterIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/" className="hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                  Featured Projects
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                  Products & SaaS
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* AI Platform Solutions */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              AI Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/ai-assistant" className="text-brand-blue dark:text-brand-cyan hover:underline flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Project Discovery
                </Link>
              </li>
              <li>
                <Link to="/ai-assistant" className="hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                  Interactive Prototype Generator
                </Link>
              </li>
              <li>
                <Link to="/services/custom-software-development" className="hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                  Custom Software
                </Link>
              </li>
              <li>
                <Link to="/services/ai-integration-automation" className="hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                  AI Integration & LLMs
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Get In Touch
            </h4>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-blue dark:text-brand-cyan flex-shrink-0 mt-0.5" />
                <span>Silicon Horizon Tech Park, 400 Innovation Way, Suite 800</span>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail className="w-4 h-4 text-brand-blue dark:text-brand-cyan flex-shrink-0" />
                <a href="mailto:contact@specialtech.com" className="hover:text-slate-900 dark:hover:text-white transition-colors break-all">
                  contact@specialtech.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-blue dark:text-brand-cyan flex-shrink-0" />
                <a href="tel:+15553827000" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  +1 (555) 382-7000
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} SPECIAL TECH. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer">Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

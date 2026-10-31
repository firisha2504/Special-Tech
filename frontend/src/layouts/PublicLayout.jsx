import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Bot, Sparkles } from 'lucide-react';

export const PublicLayout = () => {
  const location = useLocation();
  const isAIAssistantPage = location.pathname.startsWith('/ai-assistant');

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 relative overflow-x-clip">
      <Navbar />

      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      {/* Floating AI Assistant Trigger (Hidden when on AI Assistant page) */}
      {!isAIAssistantPage && (
        <aside aria-label="AI Assistant Quick Access" className="fixed bottom-6 right-6 z-40">
          <Link
            to="/ai-assistant"
            className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-brand-blue to-cyan-500 text-white font-semibold text-sm shadow-glow-blue hover:shadow-glow-cyan hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-cyan-200" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300"></span>
              </span>
            </div>
            <span className="hidden sm:inline">Ask Special AI</span>
            <Sparkles className="w-4 h-4 text-cyan-200 opacity-70 group-hover:opacity-100 transition-opacity" />
          </Link>
        </aside>
      )}

      <Footer />
    </div>
  );
};

export default PublicLayout;

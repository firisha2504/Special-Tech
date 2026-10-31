import React, { useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  UserCheck,
  Calendar,
  Pill,
  Receipt,
  Package,
  ShoppingBag,
  Tag,
  Boxes,
  Truck,
  FileText,
  TrendingUp,
  Building2,
  Briefcase,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Send,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sliders,
  DollarSign,
  Activity,
  BedDouble,
  Stethoscope,
  Layers,
  Award,
  Home,
  MessageSquare,
  Zap,
} from 'lucide-react';
import SystemTable from './SystemTable';
import SystemChart from './SystemChart';
import SystemModalForm from './SystemModalForm';
import { prototypeApi } from '../../services/api';

const iconComponents = {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  UserCheck,
  Calendar,
  Pill,
  Receipt,
  Package,
  ShoppingBag,
  Tag,
  Boxes,
  Truck,
  FileText,
  TrendingUp,
  Building2,
  Briefcase,
  DollarSign,
  Activity,
  BedDouble,
  Stethoscope,
  Layers,
  Award,
  Home,
  MessageSquare,
  Zap,
};

export const PrototypeWorkspace = ({
  prototypeData,
  onModify,
  onSubmitProjectClick,
  onDownloadSpec,
}) => {
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [activeModule, setActiveModule] = useState('dashboard');
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [modifying, setModifying] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const config = prototypeData?.configuration || {};
  const currentVersion = prototypeData?.currentVersion || {};
  const theme = config.theme || { primaryColor: '#087BFF', accentColor: '#08D9E8' };

  // Responsive frame widths
  const frameWidths = {
    desktop: 'w-full',
    tablet: 'max-w-[768px] mx-auto border-x-4 border-slate-700 shadow-2xl',
    mobile: 'max-w-[390px] mx-auto border-4 border-slate-700 rounded-3xl overflow-hidden shadow-2xl',
  };

  const handleAiModifySubmit = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setModifying(true);
    try {
      await onModify(aiPrompt);
      setAiPrompt('');
    } catch (err) {
      alert('Modification failed: ' + err.message);
    } finally {
      setModifying(false);
    }
  };

  // Determine active table to show
  const activeTableKey = Object.keys(config.tables || {}).find(
    (k) => k === activeModule
  ) || Object.keys(config.tables || {})[0];

  const activeTable = config.tables ? config.tables[activeTableKey] : null;
  const activeForm = config.forms ? config.forms[activeTableKey] || Object.values(config.forms)[0] : null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl relative">
      {/* 1. TOP TOOLBAR */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-20">
        {/* System Title & Version */}
        <div className="flex items-center gap-3">
          <img
            src="/logo/special-tech-icon.png"
            alt="Special Tech"
            className="w-8 h-8 rounded-lg object-contain shadow-md flex-shrink-0 border border-slate-200 dark:border-slate-700/60"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{config.systemName || 'Interactive System Prototype'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-950 text-brand-blue dark:text-cyan-400 border border-blue-200 dark:border-cyan-800/60">
                v{currentVersion.versionNumber || 1}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">{config.tagline}</span>
          </div>
        </div>

        {/* Device Viewport Mode Toggles */}
        <div className="flex items-center bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setDeviceMode('desktop')}
            title="Desktop Mode (100%)"
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
              deviceMode === 'desktop' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            title="Tablet Mode (768px)"
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
              deviceMode === 'tablet' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tablet</span>
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            title="Mobile Mode (390px)"
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
              deviceMode === 'mobile' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Actions: AI Modify, PDF Spec & Submit */}
        <div className="flex items-center gap-2">
          {/* Toggle AI Modification Panel */}
          <button
            onClick={() => setAiChatOpen(!aiChatOpen)}
            className="px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-700 dark:bg-violet-600/20 dark:text-violet-300 hover:bg-violet-500/20 border border-violet-500/30 dark:border-violet-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
            <span>AI Customize</span>
          </button>

          {/* Download Spec PDF */}
          {onDownloadSpec && (
            <button
              onClick={onDownloadSpec}
              title="Download Project Specification PDF"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          )}

          {/* Main Submit CTA */}
          <button
            onClick={onSubmitProjectClick}
            id="prototype-btn-submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-blue flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-200" />
            <span>Submit Project to Special Tech</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE WITH RESPONSIVE CONTAINER */}
      <div className="flex-1 overflow-y-auto bg-slate-100/70 dark:bg-slate-950 p-2 sm:p-4">
        <div className={`${frameWidths[deviceMode]} transition-all duration-300 bg-white dark:bg-slate-900 rounded-xl overflow-hidden min-h-[600px] flex flex-col md:flex-row border border-slate-200 dark:border-slate-800/80 shadow-sm`}>
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className="w-full md:w-56 bg-slate-50/90 dark:bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between flex-shrink-0">
            <div className="space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-2">
                System Navigation
              </div>
              <nav className="space-y-1">
                {config.modules?.map((mod) => {
                  const Icon = iconComponents[mod.icon] || LayoutDashboard;
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModule(mod.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                      }`}
                      style={{
                        backgroundColor: isActive ? theme.primaryColor : undefined,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{mod.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/60 text-[10px] text-slate-500 space-y-1">
              <div>Demonstration Prototype</div>
              <div className="text-brand-blue dark:text-brand-cyan font-mono font-semibold">Special Tech Engine</div>
            </div>
          </aside>

          {/* MAIN PROTOTYPE CONTENT */}
          <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/60">
            {/* Top KPIs Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {config.kpis?.map((kpi, idx) => {
                const Icon = iconComponents[kpi.icon] || TrendingUp;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
                  >
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{kpi.label}</span>
                      <Icon className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{kpi.value}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Data Table for the current module */}
            {activeTable && (
              <SystemTable
                tableConfig={activeTable}
                primaryColor={theme.primaryColor}
                onAddClick={activeForm ? () => setModalFormOpen(true) : null}
              />
            )}

            {/* Interactive Visual Charts */}
            {config.charts && config.charts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {config.charts.map((chart) => (
                  <SystemChart
                    key={chart.id}
                    chart={chart}
                    primaryColor={theme.primaryColor}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 3. SLIDE-OUT AI MODIFICATION PANEL */}
      {aiChatOpen && (
        <aside className="absolute right-0 top-[52px] bottom-0 w-full sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-700 p-4 z-30 flex flex-col justify-between shadow-2xl animate-fadeIn">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">AI Prototype Modifier</span>
              </div>
              <button
                onClick={() => setAiChatOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tell Special AI how to adjust this prototype. For example:
            </p>

            <div className="space-y-1.5">
              {[
                'Add parent messaging module',
                'Change color theme to violet',
                'Add fleet & transport module',
                'Add system efficiency KPI metric',
              ].map((promptChip) => (
                <button
                  key={promptChip}
                  onClick={() => setAiPrompt(promptChip)}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-[11px] text-slate-700 hover:text-brand-blue dark:text-slate-300 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700/60 transition-colors shadow-sm"
                >
                  ✦ {promptChip}
                </button>
              ))}
            </div>

            {currentVersion.changeNotes && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                <span className="text-brand-blue dark:text-brand-cyan font-bold block">Latest Version Update:</span>
                <span className="text-slate-600 dark:text-slate-400">{currentVersion.changeNotes}</span>
              </div>
            )}
          </div>

          {/* Modification Input Form */}
          <form onSubmit={handleAiModifySubmit} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <textarea
                rows={2}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI to modify design or modules..."
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-violet-500 resize-none shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={modifying || !aiPrompt.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
            >
              {modifying ? (
                <span>AI Updating Prototype...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply AI Changes</span>
                </>
              )}
            </button>
          </form>
        </aside>
      )}

      {/* 4. MODAL FORM POPUP */}
      {modalFormOpen && activeForm && (
        <SystemModalForm
          formConfig={activeForm}
          primaryColor={theme.primaryColor}
          onClose={() => setModalFormOpen(false)}
          onSubmit={(data) => {
            alert(`Record added to prototype simulation successfully!`);
            setModalFormOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default PrototypeWorkspace;

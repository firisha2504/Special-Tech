import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { serviceApi, projectApi } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import {
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  Globe,
  Smartphone,
  ShieldCheck,
  Palette,
  Database,
  Compass,
  CheckCircle2,
  ChevronDown,
  Layers,
  Terminal,
  Server,
  Star,
  ExternalLink,
  Laptop,
  Flame,
  Check,
} from 'lucide-react';

const iconMap = {
  Code2,
  Globe,
  Smartphone,
  Cpu,
  Palette,
  Database,
  ShieldCheck,
  Compass,
};

export const HomePage = () => {
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    serviceApi.getAll().then((res) => {
      if (res.data.success) setServices(res.data.data.slice(0, 8));
    }).catch(() => {});

    projectApi.getAll({ featured: 'true' }).then((res) => {
      if (res.data.success) setProjects(res.data.data.slice(0, 3));
    }).catch(() => {});
  }, []);

  const faqs = [
    {
      q: 'How does the Special Tech AI Project Assistant work?',
      a: 'Our AI Assistant acts like an expert software business analyst. You describe your idea in everyday language, and it asks targeted questions about your users, workflows, and modules. It then synthesizes structured requirements and instantly generates an interactive, clickable prototype of your system so you can see how it works before hiring us.',
    },
    {
      q: 'Is the prototype just a static picture or a real interactive interface?',
      a: 'It is a real, interactive visual prototype built with responsive React components! You can click through modules, inspect data tables, test admission/order forms, switch between Desktop, Tablet, and Mobile views, and even tell the AI to modify colors or add modules in real time.',
    },
    {
      q: 'Why does Special Tech use PostgreSQL exclusively?',
      a: 'PostgreSQL is the gold standard for reliable enterprise software. Its strict ACID compliance, relational integrity, advanced indexing, and native JSONB capabilities ensure your business data is secure, transactional, and scalable for millions of users without data corruption.',
    },
    {
      q: 'Do I own the full intellectual property (IP) and source code?',
      a: '100% yes. When you build your software with Special Tech, you receive complete source code ownership, private Git repository access, documentation, and database migration scripts upon project completion. Zero vendor lock-in.',
    },
    {
      q: 'What is the typical development timeline for a custom software project?',
      a: 'Because our AI discovery engine generates specifications and interactive prototypes upfront, development starts with zero ambiguity. Typical MVPs and business platforms are delivered within 4 to 8 weeks, backed by continuous testing and milestone reviews.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-8 overflow-hidden">
        {/* Glow Effects Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,600px)] h-[350px] bg-gradient-to-tr from-brand-blue/20 via-brand-cyan/20 to-brand-violet/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan text-xs font-semibold tracking-wide uppercase shadow-glow-cyan animate-pulse-slow">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI-Powered Software Development Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="hero-title font-extrabold tracking-tight text-slate-900 dark:text-white">
                Turn Your Ideas Into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-brand-blue to-cyan-500 dark:from-blue-400 dark:via-cyan-400 dark:to-violet-400">
                  Intelligent Digital Solutions.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                From your first idea to a fully functional digital product, Special Tech helps you discover, design, and build innovative software solutions powered by modern technology and AI.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  to="/ai-assistant"
                  id="hero-btn-start"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-brand-blue to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-glow-blue hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <Sparkles className="w-5 h-5 text-cyan-200" />
                  <span>Start Your Project With AI</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/projects"
                  id="hero-btn-explore"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold border border-slate-300 dark:border-slate-700/80 bg-white/80 dark:bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 shadow-sm transition-all duration-200"
                >
                  <Laptop className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                  <span>Explore Our Work</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                  <span>Instant Interactive Prototypes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                  <span>PostgreSQL Architecture</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                  <span>100% IP & Code Ownership</span>
                </div>
              </div>
            </div>

            {/* Right Visual: High-Tech Floating AI Assistant Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Floating Preview Card */}
                <div className="rounded-2xl glass-panel p-5 shadow-2xl border border-slate-200 dark:border-white/10 relative overflow-hidden backdrop-blur-xl">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-brand-blue dark:text-brand-cyan font-mono bg-blue-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-cyan-800/50">
                      <Sparkles className="w-3 h-3" />
                      <span>Special AI Architect • Active</span>
                    </div>
                  </div>

                  {/* Simulated AI Chat Workflow */}
                  <div className="space-y-3.5 py-4 text-xs font-sans">
                    {/* User Message */}
                    <div className="flex items-start justify-end gap-2">
                      <div className="bg-brand-blue text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-md">
                        <p className="font-medium">"I want to build a school management system with biometric attendance and fee portal."</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <img
                        src="/logo/special-tech-icon.png"
                        alt="Special AI"
                        className="w-8 h-8 rounded-lg object-contain shadow-glow-cyan flex-shrink-0"
                      />
                      <div className="bg-slate-100 dark:bg-slate-800/80 p-3.5 rounded-2xl rounded-tl-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/50 max-w-[90%] space-y-2">
                        <p className="font-semibold text-brand-blue dark:text-brand-cyan">Requirements Understood & Mapped!</p>
                        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                          Identified 6 core modules: Student Registry, Faculty, Attendance, Fees, and Report Cards.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-300 font-mono text-[10px]">
                            PostgreSQL + React
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px]">
                            Interactive Prototype Ready
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Prototype Mini-Preview */}
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Interactive Preview Generated</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">Status: Live Demo</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white dark:bg-slate-800/80 p-2 rounded-lg text-center border border-slate-200 dark:border-slate-700/40 shadow-sm">
                        <span className="block text-slate-500 dark:text-slate-400 text-[9px]">Students</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">1,420</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800/80 p-2 rounded-lg text-center border border-slate-200 dark:border-slate-700/40 shadow-sm">
                        <span className="block text-slate-500 dark:text-slate-400 text-[9px]">Attendance</span>
                        <span className="font-bold text-brand-blue dark:text-cyan-400 text-xs">96.8%</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800/80 p-2 rounded-lg text-center border border-slate-200 dark:border-slate-700/40 shadow-sm">
                        <span className="block text-slate-500 dark:text-slate-400 text-[9px]">Fee Collected</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">$512K</span>
                      </div>
                    </div>
                    <Link
                      to="/ai-assistant"
                      className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-glow-blue hover:opacity-90 transition-opacity"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Launch Your Free Prototype</span>
                    </Link>
                  </div>
                </div>

                {/* Decorative floating badge */}
                <div className="absolute -bottom-4 left-0 sm:-left-2 glass-panel px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-xl hidden sm:flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-600/30 border border-violet-300 dark:border-violet-500/50 flex items-center justify-center text-violet-700 dark:text-violet-300">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Requirement Discovery</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Under 3 Minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPANY INTRODUCTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800/80 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-3">
              <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">The Special Tech Paradigm</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                You bring the idea. Our AI helps you understand it, visualize it, and turn it into reality.
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                Most software projects fail because requirements are misunderstood and wireframes are static. Special Tech bridges this gap by combining an intelligent business analyst AI engine with elite full-stack engineers to deliver resilient, production-ready software systems with zero surprises.
              </p>
            </div>
            <div className="flex flex-col gap-3 justify-center">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">No ambiguous wireframes</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Interactive preview before hiring</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Strict PostgreSQL reliability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR SERVICES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">What We Build</span>
          <h2 className="section-title text-slate-900 dark:text-white">
            Comprehensive Software & Digital Solutions
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            From modern web applications to AI-integrated automation workflows and normalized database architectures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || Code2;
            return (
              <div
                key={service.id}
                className="group p-6 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80 hover:border-brand-blue/50 dark:hover:border-brand-blue/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft dark:hover:shadow-glow-blue flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/15 border border-brand-blue/20 dark:border-brand-blue/30 text-brand-blue dark:text-brand-cyan flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold">
                  <Link
                    to={`/services#${service.slug}`}
                    className="text-brand-blue dark:text-brand-cyan hover:underline flex items-center gap-1 transition-colors"
                  >
                    <span>Explore details</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-brand-blue dark:hover:border-brand-cyan text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-brand-blue dark:hover:text-white transition-all bg-white dark:bg-transparent shadow-sm"
          >
            <span>View All 8 Engineering Services</span>
            <ArrowRight className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
          </Link>
        </div>
      </section>

      {/* 4. HOW SPECIAL TECH WORKS (4-STEP TIMELINE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">The Process</span>
          <h2 className="section-title text-slate-900 dark:text-white">
            From Your Idea to a Working Solution
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Our streamlined 4-phase methodology guarantees transparency, speed, and precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Share Your Idea',
              desc: 'Tell our AI what you need in simple, plain language. No technical jargon required.',
              icon: Terminal,
              color: 'from-blue-600 to-cyan-500',
            },
            {
              step: '02',
              title: 'AI Analysis',
              desc: 'Our AI software analyst asks targeted questions and creates a complete specification.',
              icon: Cpu,
              color: 'from-cyan-500 to-blue-600',
            },
            {
              step: '03',
              title: 'Interactive Prototype',
              desc: 'Test and preview a live, clickable prototype of your system before making any hiring commitment.',
              icon: Laptop,
              color: 'from-blue-600 to-violet-600',
            },
            {
              step: '04',
              title: 'Build & Deliver',
              desc: 'Our senior engineers develop, test, and deploy your custom solution to cloud production.',
              icon: Server,
              color: 'from-violet-600 to-indigo-600',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-6 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80 relative space-y-4 hover:border-brand-blue/40 dark:hover:border-brand-cyan/40 transition-all duration-300 hover:shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} text-white flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-extrabold text-slate-300 dark:text-slate-700 font-mono">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. AI-POWERED PROJECT DISCOVERY FEATURE CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-brand-blue/40 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-brand-blue/30 text-cyan-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Breakthrough Tool</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Special AI — Your Intelligent Project Assistant
              </h2>
              <p className="text-slate-200 text-base max-w-2xl leading-relaxed">
                Describe your idea in simple language. Our AI software analyst will help you understand your system requirements, suggest essential modules, and generate an interactive prototype for you right now.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {['School Management', 'E-commerce Platform', 'Hospital ERP', 'Warehouse Inventory', 'Booking System'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex items-center justify-center lg:justify-end">
              <Link
                to="/ai-assistant"
                id="feature-cta-chat"
                className="px-8 py-5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-base shadow-glow-cyan hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 text-center"
              >
                <Sparkles className="w-5 h-5" />
                <span>Start Free Discovery</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURED PROJECTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Portfolio</span>
            <h2 className="section-title text-slate-900 dark:text-white">
              Featured Systems & Applications
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              A selection of our latest high-performance digital platforms in production.
            </p>
          </div>
          <Link
            to="/projects"
            className="text-brand-blue dark:text-brand-cyan hover:underline text-sm font-semibold flex items-center gap-1.5"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-4">
            <Layers className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                No projects published yet. Our portfolio is growing.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                Our engineering team is actively building tailored software and enterprise platforms. Check back soon for newly published client deployments or submit your project idea today.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/ai-assistant"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue hover:opacity-90 transition-all"
              >
                <span>Start Your Project Discovery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80 overflow-hidden group hover:border-brand-blue/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={getImageUrl(proj.coverImage || proj.screenshots?.[0], 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80')}
                      alt={proj.title}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-brand-cyan backdrop-blur-md border border-brand-cyan/30">
                      {proj.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors">
                      {proj.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">
                      {proj.shortDesc}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {proj.technologies?.slice(0, 4).map((tech) => (
                        <span key={tech} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/40 mt-4 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    {proj.status}
                  </span>
                  <Link
                    to={`/projects`}
                    className="text-xs font-semibold text-brand-blue dark:text-brand-cyan hover:underline flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. WHY CHOOSE SPECIAL TECH */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Our Advantage</span>
          <h2 className="section-title text-slate-900 dark:text-white">
            Why Choose Special Tech?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'AI-Powered Project Assistant',
              desc: 'Translate vague thoughts into structured engineering specifications and clickable prototypes in minutes.',
            },
            {
              title: 'Senior Architectural Leadership',
              desc: 'Every system is overseen by seasoned architects with proven track records in scalable distributed systems.',
            },
            {
              title: 'PostgreSQL-First Architecture',
              desc: 'Relational data integrity, ACID transactional guarantees, and zero-compromise database security.',
            },
            {
              title: 'Transparent Collaboration',
              desc: 'Bi-weekly demo sprints, continuous staging previews, and clear milestones. No hidden surprises.',
            },
            {
              title: 'On-Time Delivery & Ongoing SLA',
              desc: 'Rigorous sprint estimations backed by 24/7 server health telemetry and dedicated post-launch support.',
            },
            {
              title: '100% IP & Code Ownership',
              desc: 'You receive all repository commits, documentation, and database migrations. It is completely yours.',
            },
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800/80 space-y-3 hover:shadow-soft">
              <div className="w-8 h-8 rounded-lg bg-brand-blue/10 dark:bg-brand-cyan/15 text-brand-blue dark:text-brand-cyan flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. TECHNOLOGY STACK SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Tech Stack</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Engineered With Modern Industry Standards
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
          {[
            { name: 'React', category: 'Frontend', color: 'text-sky-600 dark:text-cyan-400' },
            { name: 'Tailwind CSS', category: 'Design System', color: 'text-teal-600 dark:text-teal-400' },
            { name: 'Node.js Express', category: 'Backend API', color: 'text-emerald-600 dark:text-emerald-400' },
            { name: 'PostgreSQL', category: 'Database', color: 'text-blue-600 dark:text-blue-400' },
            { name: 'Prisma ORM', category: 'Data Access', color: 'text-indigo-600 dark:text-indigo-400' },
            { name: 'Gemini / OpenAI', category: 'AI Intelligence', color: 'text-violet-600 dark:text-violet-400' },
          ].map((tech) => (
            <div key={tech.name} className="p-4 rounded-xl glass-panel border border-slate-200 dark:border-slate-800 space-y-1 hover:shadow-soft">
              <span className={`text-base font-extrabold ${tech.color}`}>{tech.name}</span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">{tech.category}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FAQS ACCORDION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Frequently Asked Questions</span>
          <h2 className="section-title text-slate-900 dark:text-white">
            Everything You Need To Know
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl glass-panel border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-slate-900 dark:text-white hover:text-brand-blue dark:hover:text-brand-cyan transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-brand-blue dark:text-brand-cyan transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800/60 pt-3 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. FINAL CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-10 sm:p-16 bg-gradient-to-r from-blue-700 via-brand-blue to-cyan-500 text-center space-y-6 shadow-glow-blue relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Ready To Turn Your Software Idea Into Reality?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Start an interactive discovery session with our AI software analyst. Preview your prototype in minutes and discuss with our lead architects.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/ai-assistant"
              id="final-cta-btn"
              className="px-8 py-4 rounded-xl bg-slate-950 text-white hover:bg-slate-900 font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-brand-cyan" />
              <span>Launch AI Project Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all"
            >
              Contact Sales Directly
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import {
  Target,
  Eye,
  ShieldCheck,
  Zap,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Code2,
  CheckCircle2,
  Laptop,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage = () => {
  const [team, setTeam] = useState([]);

  useEffect(() => {
    adminApi.getTeam().then((res) => {
      if (res.data.success) setTeam(res.data.data);
    }).catch(() => {});
  }, []);

  const values = [
    {
      title: 'Relentless Innovation',
      desc: 'We explore cutting-edge AI architectures and modern engineering patterns to solve previously intractable problems.',
      icon: Sparkles,
      color: 'text-brand-cyan',
    },
    {
      title: 'Architectural Integrity',
      desc: 'We never compromise on database normalization, security tokens, or transaction safety. PostgreSQL is our bedrock.',
      icon: ShieldCheck,
      color: 'text-brand-blue',
    },
    {
      title: 'Radical Transparency',
      desc: 'Clickable prototypes and clear specifications upfront so our partners always know exactly what is being built.',
      icon: Eye,
      color: 'text-emerald-400',
    },
    {
      title: 'Customer-First Focus',
      desc: 'Software is worthless if your team cannot operate it smoothly. We engineer for intuitive human experiences.',
      icon: Users,
      color: 'text-violet-400',
    },
  ];

  return (
    <div className="space-y-24 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. Header Banner */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">About Special Tech</span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight">
          Pioneering Intelligent Software Solutions
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          We are a team of software architects, AI engineers, and UI/UX designers building digital solutions for a better tomorrow.
        </p>
      </section>

      {/* 2. Our Story */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Our Story</span>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Founded To Eliminate The Software Communication Gap
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            Special Tech started with a simple idea — to make high-grade software technology accessible to everyone. We noticed that organizations and individuals with extraordinary business ideas often struggle to explain technical requirements, leading to bloated budgets and misaligned software deliverables.
          </p>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            We built Special Tech as a dual-engine company: an intelligent AI business analyst platform that translates ideas into clickable prototypes upfront, paired with an elite software engineering studio that turns those blueprints into resilient production systems.
          </p>
          <div className="pt-2">
            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-semibold text-sm shadow-glow-blue transition-all"
            >
              <span>Test Our AI Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-3xl glass-panel p-2 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl relative">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80"
            alt="Special Tech Engineering Team"
            className="w-full h-80 sm:h-96 object-cover rounded-2xl"
          />
        </div>
      </section>

      {/* 3. Mission & Vision */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-4 hover:shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            Empower businesses and individuals with intelligent, bespoke software solutions that eliminate operational friction, automate repetitive labor, and create compounding enterprise value.
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-4 hover:shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-brand-cyan/20 text-brand-blue dark:text-brand-cyan flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Our Vision</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            To be the premier AI-powered technology company trusted worldwide for architectural reliability, visionary UI/UX design, and transforming customer ideas into high-performance software reality.
          </p>
        </div>
      </section>

      {/* 4. Core Values */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Principles</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Our Core Values</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="p-6 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 space-y-3 hover:shadow-soft">
                <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center ${v.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{v.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Development Approach & Methodology */}
      <section className="p-8 sm:p-12 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="space-y-3">
          <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Methodology</span>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Our Engineering Approach
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm max-w-3xl leading-relaxed">
            We follow domain-driven, test-driven agile software development. By leveraging modular React frontend architectures and strict PostgreSQL relational schemas via Prisma, we ensure every product is horizontally scalable from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {[
            { phase: '01', title: 'AI Discovery', detail: 'Rapid requirement mapping & interactive prototype generation.' },
            { phase: '02', title: 'Architecture Sprint', detail: 'Normalized PostgreSQL schema, indexes, and API contract design.' },
            { phase: '03', title: 'Agile Build', detail: '2-week sprint cycles with live staging demonstrations.' },
            { phase: '04', title: 'Cloud Launch & SLA', detail: 'Automated CI/CD deployment, SSL, and continuous 24/7 monitoring.' },
          ].map((item) => (
            <div key={item.phase} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold text-brand-blue dark:text-brand-cyan">Phase {item.phase}</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Executive Leadership Team */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Leadership</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Meet Our Leadership Team
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
            Experienced architects, AI specialists, and designers working together to build your software.
          </p>
        </div>

        {team.length === 0 ? (
          <div className="p-10 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Engineering & Executive Directory</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Our engineering team directory is currently being updated. Please contact us directly for architecture and enterprise leadership inquiries.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.id} className="p-6 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 space-y-4 text-center group hover:border-brand-blue/50 transition-all hover:shadow-soft">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-brand-blue/30 dark:border-brand-cyan/40 p-1 group-hover:scale-105 transition-transform">
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors">{member.name}</h4>
                  <p className="text-xs text-brand-blue dark:text-brand-cyan font-medium">{member.role}</p>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {member.bio}
                </p>
                <div className="flex flex-wrap justify-center gap-1 pt-2">
                  {member.skills?.slice(0, 3).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AboutPage;

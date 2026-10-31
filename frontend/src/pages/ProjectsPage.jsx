import React, { useState, useEffect } from 'react';
import { projectApi } from '../services/api';
import {
  Search,
  ExternalLink,
  Code2,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const GithubIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const CATEGORIES = [
  'All',
  'Web Applications',
  'Mobile Applications',
  'AI Projects',
  'Custom Systems',
];

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [selectedCategory, searchQuery]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectApi.getAll({
        category: selectedCategory,
        search: searchQuery,
      });
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Our Portfolio</span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight">
          Featured Engineering Projects
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          Explore some of our production web, mobile, and AI solutions powered by PostgreSQL and modern frontend design.
        </p>
      </section>

      {/* Filter and Search Bar */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-glow-blue'
                    : 'bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-brand-blue dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects or stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl glass-panel animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Layers className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No projects found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your category filter or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800/80 overflow-hidden group hover:border-brand-blue/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="h-52 overflow-hidden relative cursor-pointer" onClick={() => setActiveProject(proj)}>
                    <img
                      src={proj.screenshots?.[0] || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 text-brand-cyan backdrop-blur-md border border-brand-cyan/30">
                      {proj.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3
                      onClick={() => setActiveProject(proj)}
                      className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors cursor-pointer"
                    >
                      {proj.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {proj.shortDesc}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {proj.technologies?.slice(0, 5).map((tech) => (
                        <span key={tech} className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    {proj.status}
                  </span>

                  <button
                    onClick={() => setActiveProject(proj)}
                    className="text-xs font-semibold text-brand-blue dark:text-brand-cyan hover:underline flex items-center gap-1.5 transition-colors"
                  >
                    <span>View System Specs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Project Details Modal */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 relative shadow-2xl space-y-6">
            <button
              onClick={() => setActiveProject(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-brand-blue dark:text-brand-cyan uppercase">{activeProject.category}</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{activeProject.title}</h2>
              <div className="flex items-center gap-3 text-xs text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeProject.status}
                </span>
              </div>
            </div>

            {/* Screenshots Gallery */}
            {activeProject.screenshots?.length > 0 && (
              <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80">
                <img
                  src={activeProject.screenshots[0]}
                  alt={activeProject.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Full Description */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Project Architecture & Overview</h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {activeProject.description}
              </p>
            </div>

            {/* Features List */}
            {activeProject.features?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Key Functional Modules</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeProject.features.map((feat, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <Sparkles className="w-3.5 h-3.5 text-brand-blue dark:text-brand-cyan flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Technology Stack</h4>
              <div className="flex flex-wrap gap-2">
                {activeProject.technologies?.map((tech) => (
                  <span key={tech} className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan font-mono text-xs border border-blue-200 dark:border-brand-blue/30 font-semibold">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Links and CTA */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {activeProject.demoUrl && (
                  <a
                    href={activeProject.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-glow-blue hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Live Demo</span>
                  </a>
                )}
                {activeProject.githubUrl && (
                  <a
                    href={activeProject.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
                  >
                    <GithubIcon />
                    <span>Source Code</span>
                  </a>
                )}
              </div>

              <Link
                to="/ai-assistant"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue/10 dark:bg-brand-cyan/20 text-brand-blue dark:text-brand-cyan hover:bg-brand-blue hover:text-white dark:hover:bg-brand-cyan dark:hover:text-slate-950 font-bold text-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Build Similar System with AI</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;

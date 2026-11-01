import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectApi } from '../services/api';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Building2,
  CheckCircle2,
  Layers,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Share2,
  Check,
  Code2,
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

const GithubIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const ProjectDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProject();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const fetchProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectApi.getBySlug(slug);
      if (res.data.success && res.data.data) {
        setProject(res.data.data);
      } else {
        setError('Project not found');
      }
    } catch (err) {
      console.error('Failed to fetch project detail:', err);
      setError('Unable to load project details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-8 animate-pulse">
        <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-12 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-96 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl md:col-span-2" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Project Not Found</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
          The portfolio project you are looking for might have been moved, renamed, or is currently in draft status.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-glow-blue hover:opacity-95 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portfolio Projects</span>
        </Link>
      </div>
    );
  }

  // Combine cover image and screenshots for gallery
  const gallery = [];
  if (project.coverImage) gallery.push(getImageUrl(project.coverImage));
  if (Array.isArray(project.screenshots)) {
    project.screenshots.forEach((img) => {
      if (img) {
        const resolved = getImageUrl(img);
        if (!gallery.includes(resolved)) gallery.push(resolved);
      }
    });
  }
  if (Array.isArray(project.projectImages)) {
    project.projectImages.forEach((imgObj) => {
      if (imgObj.url) {
        const resolved = getImageUrl(imgObj.url);
        if (!gallery.includes(resolved)) gallery.push(resolved);
      }
    });
  }
  if (gallery.length === 0) {
    gallery.push('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80');
  }

  return (
    <div className="space-y-16 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Share */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Projects</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            title="Share this project"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share Project</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Project Info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-blue-50 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan border border-blue-200 dark:border-brand-blue/30">
              {project.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {project.status || 'Live in Production'}
            </span>
            {project.isFeatured && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Featured Case Study
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
            {project.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {project.shortDesc}
          </p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            {project.clientName && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-slate-500 block mb-1">
                  Client / Partner
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-blue dark:text-brand-cyan" />
                  {project.clientName}
                </span>
              </div>
            )}

            {project.completionDate && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-slate-500 block mb-1">
                  Delivered On
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-blue dark:text-brand-cyan" />
                  {project.completionDate}
                </span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-slate-500 block mb-1">
                Architecture
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-blue dark:text-brand-cyan" />
                Cloud Native SaaS
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue hover:opacity-95 transition-all hover:scale-105"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Launch Live Demo</span>
              </a>
            )}

            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <GithubIcon />
                <span>Source Repository</span>
              </a>
            )}

            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-blue/10 dark:bg-brand-cyan/15 text-brand-blue dark:text-brand-cyan font-bold text-xs hover:bg-brand-blue hover:text-white dark:hover:bg-brand-cyan dark:hover:text-slate-950 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Build Similar With AI</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Gallery & Screenshots Lightbox */}
        <div className="lg:col-span-5 space-y-4">
          <div className="h-72 sm:h-96 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900 relative group">
            <img
              src={gallery[activeImageIndex]}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-950/80 text-white backdrop-blur-md border border-white/20">
              {activeImageIndex + 1} / {gallery.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2.5">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`h-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === i
                      ? 'border-brand-blue dark:border-brand-cyan shadow-md scale-102 ring-2 ring-brand-blue/30'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Description & Functional Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
          {/* Detailed Narrative */}
          <section className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              System Architecture & Overview
            </h2>
            <div className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
              {project.description}
            </div>
          </section>

          {/* Challenges & Solutions */}
          {(project.challenges || project.solutions) && (
            <section className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Engineering Challenges & Delivered Solutions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Challenge */}
                <div className="rounded-3xl p-6 sm:p-7 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400 font-bold text-sm uppercase tracking-wider font-mono">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>The Challenge</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {project.challenges || 'Managing distributed state and sub-millisecond query responses under high concurrency.'}
                  </p>
                </div>

                {/* Solution */}
                <div className="rounded-3xl p-6 sm:p-7 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider font-mono">
                    <Lightbulb className="w-4 h-4 flex-shrink-0" />
                    <span>Our Solution</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {project.solutions || 'Architected PostgreSQL partitioned tables with Redis caching layer and automated indexing.'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Key Functional Modules */}
          {Array.isArray(project.features) && project.features.length > 0 && (
            <section className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Key Functional Capabilities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.features.map((feat, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Sidebar: Tech Stack & AI Discovery CTA */}
        <div className="lg:col-span-4 space-y-8">
          {/* Tech Stack Card */}
          <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
              <span>Technology Stack</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Modern enterprise frameworks and cloud tools powering this system.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {project.technologies?.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* AI Platform CTA Banner */}
          <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-brand-blue/10 via-blue-600/5 to-cyan-500/10 border border-brand-blue/30 space-y-4 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-glow-blue">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Have a Similar Project in Mind?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Use our AI Software Assistant to clarify requirements, estimate development timelines, and generate an interactive system prototype in minutes.
            </p>
            <Link
              to="/ai-assistant"
              className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue hover:opacity-95 transition-opacity"
            >
              <span>Start AI Requirements Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Related Projects Section */}
      {Array.isArray(project.relatedProjects) && project.relatedProjects.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-brand-blue dark:text-brand-cyan uppercase tracking-wider">
                Related Case Studies
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                More in {project.category}
              </h2>
            </div>
            <Link
              to="/projects"
              className="text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.relatedProjects.map((rel) => (
              <div
                key={rel.id}
                className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-brand-blue/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 overflow-hidden relative">
                    <img
                      src={getImageUrl(rel.coverImage || rel.screenshots?.[0], 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80')}
                      alt={rel.title}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-brand-cyan backdrop-blur-md">
                      {rel.category}
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors line-clamp-1">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {rel.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/projects/${rel.slug || rel.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline"
                  >
                    <span>View Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProjectDetailPage;

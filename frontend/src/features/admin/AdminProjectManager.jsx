import React, { useState, useEffect } from 'react';
import { projectApi } from '../../services/api';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  Star,
  CheckCircle2,
  XCircle,
  Upload,
  Image as ImageIcon,
  X,
  AlertTriangle,
  Calendar,
  Layers,
  Code,
  Globe,
  Building,
  Loader2,
} from 'lucide-react';
import { getImageUrl, validateImageFile } from '../../utils/imageUrl';

export const AdminProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const defaultForm = {
    title: '',
    slug: '',
    category: 'Web Applications',
    shortDesc: '',
    description: '',
    coverImage: '',
    clientName: '',
    completionDate: '',
    challenges: '',
    solutions: '',
    features: [''],
    technologies: [''],
    screenshots: [],
    status: 'Published',
    demoUrl: '',
    githubUrl: '',
    isFeatured: false,
    isPublished: true,
  };
  const [formData, setFormData] = useState(defaultForm);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [coverPreview, setCoverPreview] = useState('');
  const [coverUploadError, setCoverUploadError] = useState('');
  const [screenshotUploadError, setScreenshotUploadError] = useState('');

  useEffect(() => {
    loadProjects();
  }, [categoryFilter, statusFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await projectApi.getAll({
        publishedOnly: 'false',
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormData(defaultForm);
    setCoverPreview('');
    setCoverUploadError('');
    setScreenshotUploadError('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj) => {
    setEditingProject(proj);
    setCoverPreview('');
    setCoverUploadError('');
    setScreenshotUploadError('');
    setFormData({
      title: proj.title || '',
      slug: proj.slug || '',
      category: proj.category || 'Web Applications',
      shortDesc: proj.shortDesc || '',
      description: proj.description || '',
      coverImage: proj.coverImage || '',
      clientName: proj.clientName || '',
      completionDate: proj.completionDate ? new Date(proj.completionDate).toISOString().split('T')[0] : '',
      challenges: proj.challenges || '',
      solutions: proj.solutions || '',
      features: proj.features && proj.features.length ? proj.features : [''],
      technologies: proj.technologies && proj.technologies.length ? proj.technologies : [''],
      screenshots: Array.isArray(proj.screenshots) ? proj.screenshots : [],
      status: proj.status || 'Published',
      demoUrl: proj.demoUrl || '',
      githubUrl: proj.githubUrl || '',
      isFeatured: Boolean(proj.isFeatured),
      isPublished: Boolean(proj.isPublished),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Auto-generate slug from title if creating
  const handleTitleChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!editingProject) {
        updated.slug = val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
      }
      return updated;
    });
  };

  // Image Upload handler for cover image (JPEG, PNG, WebP)
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverUploadError('');
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setCoverUploadError(validation.error);
      e.target.value = '';
      return;
    }

    // Display immediate local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setCoverPreview(localPreviewUrl);
    setUploadingCover(true);

    const data = new FormData();
    data.append('image', file);

    try {
      const res = await projectApi.uploadImage(data);
      if (res.data.success && res.data.data?.url) {
        const uploadedPath = res.data.data.url;
        setFormData((prev) => ({
          ...prev,
          coverImage: uploadedPath,
        }));
      }
    } catch (err) {
      setCoverUploadError(
        err.response?.data?.message || 'Failed to upload cover image. Please ensure it is a valid JPG/PNG/WebP under 10MB.'
      );
      setCoverPreview('');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  // Upload independent screenshot(s)
  const handleScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setScreenshotUploadError('');
    setUploadingScreenshot(true);

    try {
      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setScreenshotUploadError(validation.error);
          continue;
        }

        const data = new FormData();
        data.append('image', file);

        const res = await projectApi.uploadImage(data);
        if (res.data.success && res.data.data?.url) {
          const uploadedUrl = res.data.data.url;
          setFormData((prev) => ({
            ...prev,
            screenshots: prev.screenshots.includes(uploadedUrl)
              ? prev.screenshots
              : [...prev.screenshots, uploadedUrl],
          }));
        }
      }
    } catch (err) {
      setScreenshotUploadError(
        err.response?.data?.message || 'Failed to upload screenshot. Please ensure it is a valid JPG/PNG/WebP under 10MB.'
      );
    } finally {
      setUploadingScreenshot(false);
      e.target.value = '';
    }
  };

  const handleRemoveScreenshot = (idx) => {
    setFormData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== idx),
    }));
  };

  // Submit project form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        features: formData.features.filter((f) => f.trim().length > 0),
        technologies: formData.technologies.filter((t) => t.trim().length > 0),
        completionDate: formData.completionDate ? new Date(formData.completionDate).toISOString() : null,
      };

      if (editingProject) {
        await projectApi.update(editingProject.id, payload);
      } else {
        await projectApi.create(payload);
      }

      setIsModalOpen(false);
      loadProjects();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  // Quick toggles
  const handleTogglePublished = async (proj) => {
    try {
      await projectApi.updateStatus(proj.id, { isPublished: !proj.isPublished });
      setProjects((prev) =>
        prev.map((p) => (p.id === proj.id ? { ...p, isPublished: !p.isPublished } : p))
      );
    } catch (err) {
      alert('Failed to update published state');
    }
  };

  const handleToggleFeatured = async (proj) => {
    try {
      await projectApi.updateStatus(proj.id, { isFeatured: !proj.isFeatured });
      setProjects((prev) =>
        prev.map((p) => (p.id === proj.id ? { ...p, isFeatured: !p.isFeatured } : p))
      );
    } catch (err) {
      alert('Failed to update featured state');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await projectApi.delete(deleteConfirmId);
      setDeleteConfirmId(null);
      loadProjects();
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.clientName?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.shortDesc?.toLowerCase().includes(q)
    );
  });

  const categories = ['All', 'Web Applications', 'Mobile Solutions', 'Custom Systems', 'AI & Automation', 'Cloud Infrastructure'];

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Portfolio Showcase Projects</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-blue-100 dark:bg-blue-950/80 text-brand-blue dark:text-brand-cyan border border-blue-200 dark:border-blue-800">
              {projects.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage public portfolio case studies, customer showcases, and technical architectural deliverables.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-brand-blue/20 hover:shadow-glow-blue transition-all flex items-center gap-2 whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title, client, tech..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Tech Stack</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Featured</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading portfolio projects...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No portfolio projects match your filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const rawCover = p.coverImage || p.screenshots?.[0] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=300&q=80';
                  const cover = getImageUrl(rawCover, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=300&q=80');
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Project info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={cover}
                            alt={p.title}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=300&q=80';
                            }}
                            className="w-12 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{p.title}</div>
                            <div className="text-[11px] text-slate-400 font-mono">/{p.slug}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {p.category}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {p.clientName || 'Internal Product'}
                      </td>

                      {/* Tech stack */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.technologies?.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono"
                            >
                              {t}
                            </span>
                          ))}
                          {p.technologies?.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{p.technologies.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleTogglePublished(p)}
                          title="Click to toggle published"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            p.isPublished
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {p.isPublished ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{p.isPublished ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Featured */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(p)}
                          title="Click to toggle featured on homepage"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            p.isFeatured
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${p.isFeatured ? 'fill-current' : ''}`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/projects/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Preview Public Page"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Project"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            title="Delete Project"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Form Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-3xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingProject ? 'Edit Portfolio Project' : 'Add New Portfolio Project'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete the project details below to display this case study on the Special Tech website.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                {/* Title & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. Cloud Logistics Portal"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="cloud-logistics-portal"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                    >
                      <option value="Web Applications">Web Applications</option>
                      <option value="Mobile Solutions">Mobile Solutions</option>
                      <option value="Custom Systems">Custom Systems</option>
                      <option value="AI & Automation">AI & Automation</option>
                      <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Completion Date
                    </label>
                    <input
                      type="date"
                      value={formData.completionDate}
                      onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Client Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="e.g. Horizon Academy Trust, UK"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Short Summary (Card Preview) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shortDesc}
                    onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                    placeholder="Concise 1-2 sentence description for portfolio cards"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                {/* Full Description */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Full Case Study Overview *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed overview of the project scope, business requirements, and operational impact..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                      Project Cover Image
                    </label>
                    {formData.coverImage && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                        Path: {formData.coverImage.startsWith('/uploads/') ? formData.coverImage : 'Custom URL'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={formData.coverImage}
                      onChange={(e) => {
                        setFormData({ ...formData, coverImage: e.target.value });
                        setCoverPreview('');
                      }}
                      placeholder="e.g. /uploads/... or https://..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-brand-blue"
                    />
                    <label
                      className={`px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        uploadingCover
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-brand-blue/10 dark:bg-brand-blue/20 hover:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan'
                      }`}
                    >
                      {uploadingCover ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.coverImage ? 'Replace Image' : 'Upload from Computer'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        disabled={uploadingCover}
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {coverUploadError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      {coverUploadError}
                    </p>
                  )}

                  {/* Cover Image Preview */}
                  {(coverPreview || formData.coverImage) && (
                    <div className="mt-2 relative p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-28 h-18 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                          <img
                            src={getImageUrl(coverPreview || formData.coverImage)}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.warn('Cover preview failed to load:', e.target.src);
                            }}
                          />
                          {uploadingCover && (
                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 text-xs">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {coverPreview ? 'Selected Local Preview' : 'Active Cover Image'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm mt-0.5">
                            {formData.coverImage || 'Uploading...'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, coverImage: '' }));
                          setCoverPreview('');
                          setCoverUploadError('');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Screenshots Gallery */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                      Project Screenshots Gallery ({formData.screenshots.length})
                    </label>
                    <label
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border border-dashed border-brand-blue/50 dark:border-brand-cyan/50 text-brand-blue dark:text-brand-cyan hover:bg-brand-blue/10 dark:hover:bg-brand-blue/20 cursor-pointer flex items-center gap-1.5 transition-colors ${
                        uploadingScreenshot ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingScreenshot ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Upload Screenshots</span>
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        disabled={uploadingScreenshot}
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {screenshotUploadError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      {screenshotUploadError}
                    </p>
                  )}

                  {formData.screenshots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {formData.screenshots.map((s, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800"
                        >
                          <img
                            src={getImageUrl(s)}
                            alt={`Screenshot ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                            <span className="text-[10px] text-white/90 font-mono">#{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveScreenshot(idx)}
                              title="Remove Screenshot"
                              className="p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-transform hover:scale-110 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                      No screenshots uploaded yet. Select JPEG, PNG, or WebP images to build the gallery.
                    </div>
                  )}
                </div>

                {/* Technologies */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Technologies Used (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.technologies.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        technologies: e.target.value.split(',').map((t) => t.trim()),
                      })
                    }
                    placeholder="React, Node.js, PostgreSQL, Tailwind CSS, Docker"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                {/* Main Features */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Key Features (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.features.join('\n')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        features: e.target.value.split('\n'),
                      })
                    }
                    placeholder="Role-Based Portals&#10;Real-Time Attendance Sync&#10;Automated Fee Invoicing"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>

                {/* Challenges & Solutions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Challenges Overcome (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.challenges}
                      onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                      placeholder="High-concurrency database queries during morning check-ins"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Solution Delivered (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.solutions}
                      onChange={(e) => setFormData({ ...formData, solutions: e.target.value })}
                      placeholder="Implemented multi-level Redis caching and composite indexing on PostgreSQL"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                {/* Demo and GitHub links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Live Demo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.demoUrl}
                      onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                      placeholder="https://demo.client.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      GitHub Repository URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      placeholder="https://github.com/specialtech/repo"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-brand-blue rounded focus:ring-0"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Feature on Homepage
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4 text-brand-blue rounded focus:ring-0"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Published (Visible Publicly)
                    </span>
                  </label>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold shadow-md hover:shadow-glow-blue transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving Project...' : editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Portfolio Project?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                This action is permanent and cannot be undone. Any associated screenshots and customer inquiry references will be affected.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20"
              >
                Yes, Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjectManager;

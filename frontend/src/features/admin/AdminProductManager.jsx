import React, { useState, useEffect } from 'react';
import { productApi, demoRequestApi } from '../../services/api';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Star,
  CheckCircle2,
  XCircle,
  Upload,
  X,
  AlertTriangle,
  Package,
  Layers,
  DollarSign,
  Tag,
  Calendar,
  Clock,
  User,
  Mail,
  Building,
  Phone,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';

export const AdminProductManager = () => {
  const [activeSubTab, setActiveSubTab] = useState('products'); // 'products' | 'demo-requests'
  const [products, setProducts] = useState([]);
  const [demoRequests, setDemoRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Product Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formTab, setFormTab] = useState('general'); // 'general' | 'details' | 'pricing' | 'faqs'

  // Demo Request modal / notes state
  const [selectedDemoRequest, setSelectedDemoRequest] = useState(null);
  const [demoNotes, setDemoNotes] = useState('');

  const defaultProductForm = {
    name: '',
    slug: '',
    category: 'AI & Automation',
    shortDesc: '',
    description: '',
    logoUrl: '/logo/special-tech-icon.png',
    coverImage: '',
    screenshots: [],
    features: [''],
    technologies: [''],
    targetAudience: '',
    benefits: [''],
    docsUrl: '',
    demoUrl: '',
    howItWorks: '',
    faqs: [{ q: '', a: '' }],
    status: 'Published',
    isFeatured: false,
    isPublished: true,
    plans: [
      {
        name: 'Standard',
        price: 49.00,
        billingInterval: 'monthly',
        features: ['Core Features Included', 'Email Support'],
        isPopular: false,
        isActive: true,
      },
    ],
  };

  const [formData, setFormData] = useState(defaultProductForm);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadProducts();
    loadDemoRequests();
  }, [categoryFilter, statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll({
        publishedOnly: 'false',
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoRequests = async () => {
    try {
      const res = await demoRequestApi.getAll();
      if (res.data.success) {
        setDemoRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load demo requests', err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData(defaultProductForm);
    setFormError('');
    setFormTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      slug: prod.slug || '',
      category: prod.category || 'AI & Automation',
      shortDesc: prod.shortDesc || '',
      description: prod.description || '',
      logoUrl: prod.logoUrl || '/logo/special-tech-icon.png',
      coverImage: prod.coverImage || '',
      screenshots: prod.screenshots || [],
      features: prod.features && prod.features.length ? prod.features : [''],
      technologies: prod.technologies && prod.technologies.length ? prod.technologies : [''],
      targetAudience: prod.targetAudience || '',
      benefits: prod.benefits && prod.benefits.length ? prod.benefits : [''],
      docsUrl: prod.docsUrl || '',
      demoUrl: prod.demoUrl || '',
      howItWorks: prod.howItWorks || '',
      faqs: prod.faqs && prod.faqs.length ? prod.faqs : [{ q: '', a: '' }],
      status: prod.status || 'Published',
      isFeatured: Boolean(prod.isFeatured),
      isPublished: Boolean(prod.isPublished),
      plans:
        prod.plans && prod.plans.length
          ? prod.plans.map((p) => ({
              id: p.id,
              name: p.name,
              price: Number(p.price),
              billingInterval: p.billingInterval || 'monthly',
              features: p.features || [],
              isPopular: Boolean(p.isPopular),
              isActive: Boolean(p.isActive),
            }))
          : defaultProductForm.plans,
    });
    setFormError('');
    setFormTab('general');
    setIsModalOpen(true);
  };

  const handleNameChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, name: val };
      if (!editingProduct) {
        updated.slug = val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
      }
      return updated;
    });
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);
    setUploadingImage(true);

    try {
      const res = await productApi.uploadImage(data);
      if (res.data.success) {
        setFormData((prev) => ({
          ...prev,
          coverImage: res.data.data.url,
          screenshots: prev.screenshots.includes(res.data.data.url)
            ? prev.screenshots
            : [res.data.data.url, ...prev.screenshots],
        }));
      }
    } catch (err) {
      alert('Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);
    try {
      const res = await productApi.uploadImage(data);
      if (res.data.success) {
        setFormData((prev) => ({
          ...prev,
          screenshots: [...prev.screenshots, res.data.data.url],
        }));
      }
    } catch (err) {
      alert('Failed to upload screenshot.');
    }
  };

  const handleRemoveScreenshot = (idx) => {
    setFormData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== idx),
    }));
  };

  // Plan Management
  const handleAddPlan = () => {
    setFormData((prev) => ({
      ...prev,
      plans: [
        ...prev.plans,
        {
          name: 'Pro',
          price: 99.00,
          billingInterval: 'monthly',
          features: ['All Starter Features', 'Dedicated Support'],
          isPopular: false,
          isActive: true,
        },
      ],
    }));
  };

  const handleUpdatePlan = (idx, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.plans];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, plans: updated };
    });
  };

  const handleRemovePlan = (idx) => {
    setFormData((prev) => ({
      ...prev,
      plans: prev.plans.filter((_, i) => i !== idx),
    }));
  };

  // FAQ Management
  const handleAddFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { q: '', a: '' }],
    }));
  };

  const handleUpdateFaq = (idx, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.faqs];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, faqs: updated };
    });
  };

  const handleRemoveFaq = (idx) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== idx),
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        features: formData.features.filter((f) => f.trim().length > 0),
        technologies: formData.technologies.filter((t) => t.trim().length > 0),
        benefits: formData.benefits.filter((b) => b.trim().length > 0),
        faqs: formData.faqs.filter((f) => f.q.trim().length > 0 && f.a.trim().length > 0),
        plans: formData.plans.map((p) => ({
          name: p.name,
          price: Number(p.price) || 0,
          billingInterval: p.billingInterval || 'monthly',
          features: Array.isArray(p.features)
            ? p.features.filter((f) => f.trim().length > 0)
            : typeof p.features === 'string'
            ? p.features.split('\n').filter((f) => f.trim().length > 0)
            : [],
          isPopular: Boolean(p.isPopular),
          isActive: Boolean(p.isActive),
        })),
      };

      if (editingProduct) {
        await productApi.update(editingProduct.id, payload);
      } else {
        await productApi.create(payload);
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (prod) => {
    try {
      await productApi.updateStatus(prod.id, { isPublished: !prod.isPublished });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, isPublished: !p.isPublished } : p))
      );
    } catch (err) {
      alert('Failed to update published state');
    }
  };

  const handleToggleFeatured = async (prod) => {
    try {
      await productApi.updateStatus(prod.id, { isFeatured: !prod.isFeatured });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, isFeatured: !p.isFeatured } : p))
      );
    } catch (err) {
      alert('Failed to update featured state');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await productApi.delete(deleteConfirmId);
      setDeleteConfirmId(null);
      loadProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  // Demo Request status updater
  const handleUpdateDemoStatus = async (id, status) => {
    try {
      await demoRequestApi.updateStatus(id, { status });
      setDemoRequests((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      );
    } catch (err) {
      alert('Failed to update demo request status');
    }
  };

  const handleSaveDemoNotes = async (id) => {
    try {
      await demoRequestApi.updateStatus(id, {
        status: selectedDemoRequest.status,
        internalNotes: demoNotes,
      });
      setDemoRequests((prev) =>
        prev.map((d) => (d.id === id ? { ...d, internalNotes: demoNotes } : d))
      );
      setSelectedDemoRequest(null);
    } catch (err) {
      alert('Failed to save notes');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.shortDesc?.toLowerCase().includes(q)
    );
  });

  const categories = ['All', 'AI & Automation', 'Enterprise SaaS', 'Security & DevOps', 'Data & BI', 'Custom Platform'];

  const newDemoCount = demoRequests.filter((d) => d.status === 'NEW').length;

  return (
    <div className="space-y-6">
      {/* Sub-Tabs: Products vs Demo Requests */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'products'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Company Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('demo-requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'demo-requests'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Demo Requests ({demoRequests.length})</span>
            {newDemoCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950">
                {newDemoCount} New
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'products' && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-brand-blue/20 hover:shadow-glow-blue transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* VIEW 1: COMPANY PRODUCTS */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name, category..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue"
              />
            </div>

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
                  <option value="Unpublished">Unpublished</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Pricing Plans</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Featured</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Loading products...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No company products found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const cover = p.coverImage || p.screenshots?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getImageUrl(cover, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80')}
                                alt={p.name}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80';
                                }}
                                className="w-12 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{p.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">/{p.slug}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {p.category}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {p.plans?.map((plan) => (
                                <span
                                  key={plan.id || plan.name}
                                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-brand-cyan border border-blue-200 dark:border-blue-800"
                                >
                                  {plan.name}: ${Number(plan.price).toFixed(0)}/{plan.billingInterval}
                                </span>
                              ))}
                            </div>
                          </td>

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

                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleFeatured(p)}
                              title="Toggle featured showcase"
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                p.isFeatured
                                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${p.isFeatured ? 'fill-current' : ''}`} />
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/products/${p.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Preview Public Product Page"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </a>

                              <button
                                onClick={() => handleOpenEditModal(p)}
                                title="Edit Product"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setDeleteConfirmId(p.id)}
                                title="Delete Product"
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
        </div>
      )}

      {/* VIEW 2: DEMO REQUESTS CRM */}
      {activeSubTab === 'demo-requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Product Demo Requests</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Incoming leads requesting interactive walkthroughs of Special Tech products.</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Product Requested</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Requirements</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {demoRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No demo requests received yet.
                      </td>
                    </tr>
                  ) : (
                    demoRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{req.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{req.company || 'Individual'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-brand-blue dark:text-brand-cyan">
                            {req.productName || req.product?.name || 'General Platform'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <a href={`mailto:${req.email}`} className="hover:underline">{req.email}</a>
                          </div>
                          {req.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{req.phone}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{req.requirements || 'None specified'}</p>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={req.status}
                            onChange={(e) => handleUpdateDemoStatus(req.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none ${
                              req.status === 'NEW'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                : req.status === 'CONTACTED'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                                : req.status === 'SCHEDULED'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800'
                                : req.status === 'COMPLETED'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="SCHEDULED">SCHEDULED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedDemoRequest(req);
                              setDemoNotes(req.internalNotes || '');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Add / Edit Internal Notes"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Internal Notes Modal for Demo Request */}
      {selectedDemoRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Notes for {selectedDemoRequest.name}
              </h4>
              <button onClick={() => setSelectedDemoRequest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={4}
              value={demoNotes}
              onChange={(e) => setDemoNotes(e.target.value)}
              placeholder="Record follow-up calls, meeting schedules, or client specific requirements..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedDemoRequest(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveDemoNotes(selectedDemoRequest.id)}
                className="px-4 py-2 rounded-xl bg-brand-blue text-white font-semibold hover:bg-blue-600"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingProduct ? 'Edit Company Product' : 'Add New Company Product'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure technical features, pricing plans, and public presentation for this software solution.
                </p>
              </div>

              {/* Form Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
                {[
                  { id: 'general', name: '1. General Info' },
                  { id: 'details', name: '2. Features & Details' },
                  { id: 'pricing', name: `3. Pricing Plans (${formData.plans.length})` },
                  { id: 'faqs', name: `4. FAQs (${formData.faqs.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      formTab === t.id
                        ? 'bg-brand-blue text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                {/* TAB 1: GENERAL INFO */}
                {formTab === 'general' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g. SpecialFlow AI"
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
                          placeholder="specialflow-ai"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                        >
                          <option value="AI & Automation">AI & Automation</option>
                          <option value="Enterprise SaaS">Enterprise SaaS</option>
                          <option value="Security & DevOps">Security & DevOps</option>
                          <option value="Data & BI">Data & BI</option>
                          <option value="Custom Platform">Custom Platform</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Product Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                        >
                          <option value="Published">Published</option>
                          <option value="Draft">Draft</option>
                          <option value="Unpublished">Unpublished</option>
                          <option value="Discontinued">Discontinued</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Short Headline (Marketplace Summary) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.shortDesc}
                        onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                        placeholder="Autonomous multi-agent orchestration engine for complex business processes..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Full Product Description *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Comprehensive details on capabilities, architecture, and value proposition..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    {/* Cover image & Logo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Product Cover Image
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.coverImage}
                            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                            placeholder="https://... or upload"
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none"
                          />
                          <label className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Product Logo / Icon URL
                        </label>
                        <input
                          type="text"
                          value={formData.logoUrl}
                          onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                          placeholder="/logo/special-tech-icon.png"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Screenshots */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                          Screenshots & Interface Previews ({formData.screenshots.length})
                        </label>
                        <label className="text-brand-blue dark:text-brand-cyan hover:underline cursor-pointer flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          <span>Add Screenshot</span>
                          <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {formData.screenshots.map((s, idx) => (
                          <div key={idx} className="relative w-24 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                            <img src={getImageUrl(s)} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveScreenshot(idx)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: FEATURES & DETAILS */}
                {formTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Main Features (one per line)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.features.join('\n')}
                        onChange={(e) => setFormData({ ...formData, features: e.target.value.split('\n') })}
                        placeholder="Multi-Agent Collaborative Task Execution&#10;Enterprise Vector RAG&#10;Bi-directional Webhook Integrations"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Product Benefits (one per line)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.benefits.join('\n')}
                        onChange={(e) => setFormData({ ...formData, benefits: e.target.value.split('\n') })}
                        placeholder="Reduces manual business process latency by up to 85%&#10;Full audit traceability of every AI decision path"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          placeholder="Node.js, PostgreSQL, pgvector, Docker, React"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Target Audience
                        </label>
                        <input
                          type="text"
                          value={formData.targetAudience}
                          onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                          placeholder="Enterprise IT leaders, Operations Executives, and High-Growth Fintechs"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        How It Works (Operational Workflow)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.howItWorks}
                        onChange={(e) => setFormData({ ...formData, howItWorks: e.target.value })}
                        placeholder="1. Ingest documents and streams. 2. Automated agents evaluate rules. 3. Output results to APIs."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Documentation URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={formData.docsUrl}
                          onChange={(e) => setFormData({ ...formData, docsUrl: e.target.value })}
                          placeholder="https://docs.specialtech.com/product"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Live Interactive Demo URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={formData.demoUrl}
                          onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                          placeholder="https://demo.specialtech.com/product"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: PRICING PLANS */}
                {formTab === 'pricing' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Commercial Pricing Plans</h4>
                        <p className="text-[11px] text-slate-500">Define tiers such as Free, Monthly, Yearly, or Custom Enterprise plans.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPlan}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-brand-cyan border border-blue-200 dark:border-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Pricing Plan</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.plans.map((plan, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Plan #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePlan(idx)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1">Plan Name *</label>
                              <input
                                type="text"
                                required
                                value={plan.name}
                                onChange={(e) => handleUpdatePlan(idx, 'name', e.target.value)}
                                placeholder="Starter, Team, Enterprise"
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1">Price ($ USD) *</label>
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={plan.price}
                                onChange={(e) => handleUpdatePlan(idx, 'price', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1">Billing Interval</label>
                              <select
                                value={plan.billingInterval}
                                onChange={(e) => handleUpdatePlan(idx, 'billingInterval', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                              >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="free">Free</option>
                                <option value="one-time">One-time</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-500 mb-1">
                              Included Features (one per line)
                            </label>
                            <textarea
                              rows={2}
                              value={Array.isArray(plan.features) ? plan.features.join('\n') : plan.features}
                              onChange={(e) => handleUpdatePlan(idx, 'features', e.target.value.split('\n'))}
                              placeholder="Up to 5 Users&#10;Unlimited Cloud Storage&#10;24/7 SLA"
                              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-4 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={plan.isPopular}
                                onChange={(e) => handleUpdatePlan(idx, 'isPopular', e.target.checked)}
                                className="w-3.5 h-3.5 text-brand-blue rounded"
                              />
                              <span className="text-slate-700 dark:text-slate-300 text-[11px]">Badge as "Most Popular"</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: FAQS */}
                {formTab === 'faqs' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">Product FAQs</h4>
                        <p className="text-[11px] text-slate-500">Provide answers to common customer technical and deployment questions.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-brand-cyan border border-blue-200 dark:border-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.faqs.map((faq, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Question #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(idx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={faq.q}
                            onChange={(e) => handleUpdateFaq(idx, 'q', e.target.value)}
                            placeholder="e.g. Can this product run on our private VPC?"
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                          />
                          <textarea
                            rows={2}
                            value={faq.a}
                            onChange={(e) => handleUpdateFaq(idx, 'a', e.target.value)}
                            placeholder="Yes, it supports self-hosted Docker and Kubernetes clusters."
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visibility Toggles */}
                <div className="flex items-center gap-6 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-brand-blue rounded"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Feature in Marketplace & Homepage
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="w-4 h-4 text-brand-blue rounded"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Published (Publicly Viewable)
                    </span>
                  </label>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold shadow-md hover:shadow-glow-blue transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving Product...' : editingProduct ? 'Update Product' : 'Create Product'}
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Company Product?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                This action is permanent and cannot be undone. All associated commercial pricing tiers and screenshots will be permanently deleted.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductManager;

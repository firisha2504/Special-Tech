import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../services/api';
import DemoRequestModal from '../components/common/DemoRequestModal';
import {
  Search,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  Package,
  ShieldCheck,
  Zap,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Cpu,
  Database,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'AI & Automation',
  'Enterprise SaaS',
  'Security & DevOps',
  'Data & Analytics',
  'Cloud Infrastructure',
];

export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [selectedProductForDemo, setSelectedProductForDemo] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll({
        category: selectedCategory,
        search: searchQuery,
      });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch company products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDemo = (prod) => {
    setSelectedProductForDemo(prod);
    setDemoModalOpen(true);
  };

  // Helper to format pricing preview
  const getPricingPreview = (plans) => {
    if (!plans || plans.length === 0) return 'Custom Enterprise';
    const activePlans = plans.filter((p) => p.isActive !== false);
    if (activePlans.length === 0) return 'Custom Enterprise';

    const paidPlans = activePlans.filter((p) => parseFloat(p.price) > 0);
    if (paidPlans.length === 0) return 'Free Tier Available';

    const lowest = paidPlans.reduce((min, p) =>
      parseFloat(p.price) < parseFloat(min.price) ? p : min, paidPlans[0]
    );

    return `From $${parseFloat(lowest.price).toLocaleString()} / ${lowest.billingInterval || 'mo'}`;
  };

  return (
    <div className="space-y-16 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider uppercase bg-brand-blue/10 dark:bg-brand-cyan/15 text-brand-blue dark:text-brand-cyan border border-brand-blue/20 dark:border-brand-cyan/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Proprietary SaaS Solutions</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight">
          Enterprise Software Products
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
          Engineered by Special Tech to accelerate digital transformation, automate enterprise workflows, and secure digital infrastructure.
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
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, features, or stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[480px] rounded-3xl glass-panel animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 space-y-4 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-12">
            <Package className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No products found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Try adjusting your category selection or search keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800/80 overflow-hidden group hover:border-brand-blue/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-soft flex flex-col justify-between"
              >
                <div>
                  {/* Product Visual Header */}
                  <div className="h-52 overflow-hidden relative bg-slate-950">
                    <img
                      src={
                        prod.coverImage ||
                        prod.screenshots?.[0] ||
                        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />

                    {/* Category & Status Overlay */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 text-brand-cyan backdrop-blur-md border border-brand-cyan/30">
                        {prod.category}
                      </span>
                    </div>

                    {/* Logo Emblem badge if provided */}
                    {prod.logoUrl && (
                      <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 shadow-md border border-white/20 flex items-center justify-center">
                        <img src={prod.logoUrl} alt="" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Link to={`/products/${prod.slug}`}>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors">
                            {prod.name}
                          </h3>
                        </Link>
                      </div>
                      {prod.tagline && (
                        <p className="text-xs font-semibold text-brand-blue dark:text-brand-cyan line-clamp-1">
                          {prod.tagline}
                        </p>
                      )}
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {prod.shortDesc || prod.description}
                    </p>

                    {/* Top 3 Features Checklist */}
                    {Array.isArray(prod.features) && prod.features.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {prod.features.slice(0, 3).map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="line-clamp-1">{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tech Pills */}
                    {Array.isArray(prod.technologies) && prod.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {prod.technologies.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-700 dark:text-slate-300 font-mono"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Section: Pricing Preview & CTAs */}
                <div className="p-6 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-2 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Pricing</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {getPricingPreview(prod.plans)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to={`/products/${prod.slug}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleOpenDemo(prod)}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold shadow-glow-blue hover:opacity-90 transition-opacity"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Request Demo</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Enterprise Custom Deployment Banner */}
      <section className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-brand-blue/15 via-slate-900 to-[#020D20] text-white border border-brand-blue/30 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-cyan-300 border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enterprise SLA & Dedicated Hosting</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black leading-tight">
            Need a Customized SaaS Solution or On-Premise Deployment?
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            All Special Tech products can be customized for your organization’s unique workflows, compliance requirements (HIPAA, SOC2, GDPR), or private cloud VPC environments.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => handleOpenDemo(null)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs shadow-lg hover:bg-slate-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-brand-blue" />
              <span>Schedule Enterprise Consultation</span>
            </button>

            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-bold text-xs border border-white/20 hover:bg-white/20 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Scope Architecture with AI</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Request Modal */}
      <DemoRequestModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        product={selectedProductForDemo}
      />
    </div>
  );
};

export default ProductsPage;

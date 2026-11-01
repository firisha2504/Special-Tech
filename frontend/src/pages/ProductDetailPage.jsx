import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import DemoRequestModal from '../components/common/DemoRequestModal';
import {
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Check,
  ChevronDown,
  Layers,
  ShieldCheck,
  Zap,
  Users,
  Target,
  FileText,
  AlertTriangle,
  ArrowRight,
  Share2,
  HelpCircle,
  Building,
  CheckCircle,
  DollarSign,
  Star,
  Cpu,
} from 'lucide-react';

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [selectedPlanForDemo, setSelectedPlanForDemo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productApi.getBySlug(slug);
      if (res.data.success && res.data.data) {
        setProduct(res.data.data);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      setError('Unable to load product information. Please try again.');
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

  const handleOpenDemo = (plan = null) => {
    setSelectedPlanForDemo(plan);
    setDemoModalOpen(true);
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
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

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Product Not Found</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
          The software product you requested might have been updated, renamed, or is currently unpublished.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-glow-blue hover:opacity-95 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products Marketplace</span>
        </Link>
      </div>
    );
  }

  // Build screenshot gallery
  const gallery = [];
  if (product.coverImage) gallery.push(getImageUrl(product.coverImage));
  if (Array.isArray(product.screenshots)) {
    product.screenshots.forEach((img) => {
      if (img) {
        const resolved = getImageUrl(img);
        if (!gallery.includes(resolved)) gallery.push(resolved);
      }
    });
  }
  if (Array.isArray(product.productImages)) {
    product.productImages.forEach((imgObj) => {
      if (imgObj.url) {
        const resolved = getImageUrl(imgObj.url);
        if (!gallery.includes(resolved)) gallery.push(resolved);
      }
    });
  }
  if (gallery.length === 0) {
    gallery.push('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80');
  }

  // Parse FAQs if formatted as JSON or array
  let faqs = [];
  if (Array.isArray(product.faqs)) {
    faqs = product.faqs;
  } else if (typeof product.faqs === 'string' && product.faqs.trim().startsWith('[')) {
    try {
      faqs = JSON.parse(product.faqs);
    } catch {
      faqs = [];
    }
  }

  // Parse howItWorks if string/array
  let steps = [];
  if (Array.isArray(product.howItWorks)) {
    steps = product.howItWorks;
  } else if (typeof product.howItWorks === 'string') {
    if (product.howItWorks.trim().startsWith('[')) {
      try {
        steps = JSON.parse(product.howItWorks);
      } catch {
        steps = product.howItWorks.split('\n').filter(Boolean);
      }
    } else {
      steps = product.howItWorks.split('\n').filter(Boolean);
    }
  }

  return (
    <div className="space-y-16 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Share */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-blue dark:hover:text-brand-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products Marketplace</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            title="Share this product"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share Product</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Product Information */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            {product.logoUrl && (
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 flex items-center justify-center shadow-xs">
                <img src={product.logoUrl} alt="" className="w-full h-full object-contain" />
              </div>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-brand-blue/10 dark:bg-brand-cyan/20 text-brand-blue dark:text-brand-cyan border border-brand-blue/20 dark:border-brand-cyan/30">
              {product.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {product.status || 'Enterprise Ready'}
            </span>
            {product.isFeatured && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Flagship Product
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>
            {product.tagline && (
              <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-brand-blue to-cyan-500 bg-clip-text text-transparent mt-2">
                {product.tagline}
              </p>
            )}
          </div>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {product.shortDesc || product.description}
          </p>

          {/* Quick Metrics / Target Audience Banner */}
          {product.targetAudience && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <Target className="w-5 h-5 text-brand-blue dark:text-brand-cyan flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-slate-900 dark:text-white block">Designed For:</span>
                <span className="text-slate-600 dark:text-slate-300">{product.targetAudience}</span>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleOpenDemo()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue hover:opacity-95 transition-all hover:scale-105"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Request a Live Demo</span>
            </button>

            {product.demoUrl && (
              <a
                href={product.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Interactive Sandbox</span>
              </a>
            )}

            {product.docsUrl && (
              <a
                href={product.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Documentation</span>
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Screenshot Gallery Lightbox */}
        <div className="lg:col-span-5 space-y-4">
          <div className="h-72 sm:h-96 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900 relative group">
            <img
              src={gallery[activeImageIndex]}
              alt={product.name}
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

      {/* Product Overview Narrative */}
      {product.description && (
        <section className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Product Overview & Core Mission
          </h2>
          <div className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
            {product.description}
          </div>
        </section>
      )}

      {/* Key Features & Business Benefits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Features Checklist */}
        <section className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
            <span>Key Functional Capabilities</span>
          </h2>

          <div className="space-y-3">
            {Array.isArray(product.features) && product.features.length > 0 ? (
              product.features.map((feat, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                    {feat}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Feature list arriving shortly.</p>
            )}
          </div>
        </section>

        {/* Benefits / Value Props */}
        <section className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Business Benefits & ROI</span>
          </h2>

          <div className="space-y-3">
            {Array.isArray(product.benefits) && product.benefits.length > 0 ? (
              product.benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3"
                >
                  <Sparkles className="w-4 h-4 text-brand-blue dark:text-brand-cyan flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                    {benefit}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Enterprise value metrics arriving shortly.</p>
            )}
          </div>
        </section>
      </div>

      {/* How It Works Workflow Timeline */}
      {steps.length > 0 && (
        <section className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-brand-blue dark:text-brand-cyan uppercase tracking-wider">
              Deployment & Process
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">How It Works</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              From plug-and-play onboarding to production scaling in your organization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3 relative"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-mono font-black text-xs flex items-center justify-center shadow-glow-blue">
                  0{idx + 1}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {typeof step === 'object' && step.title ? step.title : `Step ${idx + 1}`}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {typeof step === 'object' && step.description ? step.description : step}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tech Stack Chips */}
      {Array.isArray(product.technologies) && product.technologies.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
            <span>Underlying Engineering Stack</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Commercial Pricing Plans Grid */}
      <section className="space-y-8 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-brand-blue dark:text-brand-cyan uppercase tracking-wider">
            Commercial Licensure
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">
            Predictable Pricing Plans
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Choose the subscription tier that aligns with your organization size and data requirements.
          </p>
        </div>

        {Array.isArray(product.plans) && product.plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {product.plans.map((plan) => {
              const isPopular = plan.isPopular;
              const price = parseFloat(plan.price);
              const isFree = price === 0;

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                    isPopular
                      ? 'bg-white dark:bg-slate-900 border-2 border-brand-blue dark:border-brand-cyan shadow-xl hover:-translate-y-1'
                      : 'glass-panel border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-glow-blue uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    {/* Price display */}
                    <div className="py-2 border-y border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        {isFree ? (
                          <span className="text-3xl font-black text-slate-900 dark:text-white">Free</span>
                        ) : (
                          <>
                            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                              ${price.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              / {plan.billingInterval || 'month'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Included Features */}
                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Included Modules:
                        </span>
                        {plan.features.map((f, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenDemo(plan)}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-glow-blue hover:opacity-90'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span>{isFree ? 'Get Free Access' : 'Choose Plan & Request Demo'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl glass-panel text-center max-w-xl mx-auto space-y-3">
            <DollarSign className="w-8 h-8 mx-auto text-brand-blue dark:text-brand-cyan" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Custom Tier Licensure</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pricing for {product.name} is configured on an enterprise per-seat or per-cluster deployment model.
            </p>
            <button
              onClick={() => handleOpenDemo()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Request Custom Pricing Quote</span>
            </button>
          </div>
        )}
      </section>

      {/* FAQs Collapsible Accordion */}
      {faqs.length > 0 && (
        <section className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-brand-blue dark:text-brand-cyan uppercase tracking-wider">
              Answers & Clarifications
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {faqs.map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div key={i} className="py-4">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full text-left flex items-center justify-between gap-4 py-2 group focus:outline-none"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors">
                      {faq.question || faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-brand-blue dark:text-brand-cyan' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pt-2 pb-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pr-8 animate-fadeIn">
                      {faq.answer || faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Related Products Section */}
      {Array.isArray(product.relatedProducts) && product.relatedProducts.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-brand-blue dark:text-brand-cyan uppercase tracking-wider">
                Explore More Solutions
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Related Software Products
              </h2>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {product.relatedProducts.map((rel) => (
              <div
                key={rel.id}
                className="rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-brand-blue/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 overflow-hidden relative">
                    <img
                      src={getImageUrl(
                        rel.coverImage || rel.screenshots?.[0],
                        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80'
                      )}
                      alt={rel.name}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-brand-cyan backdrop-blur-md">
                      {rel.category}
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors line-clamp-1">
                      {rel.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {rel.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/products/${rel.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline"
                  >
                    <span>View Product</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floating Demo Request CTA Banner */}
      <section className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-glow-blue flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-2xl font-black">Ready to test drive {product.name}?</h3>
          <p className="text-cyan-100 text-xs sm:text-sm">
            Our engineers will walk you through live telemetry, security integration, and custom setup.
          </p>
        </div>
        <button
          onClick={() => handleOpenDemo()}
          className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-950 font-black text-xs shadow-lg hover:bg-slate-100 transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-brand-blue" />
          <span>Request Personalized Demo</span>
        </button>
      </section>

      {/* Demo Request Modal with Preselected Product and Plan */}
      <DemoRequestModal
        isOpen={demoModalOpen}
        onClose={() => {
          setDemoModalOpen(false);
          setSelectedPlanForDemo(null);
        }}
        product={product}
        plan={selectedPlanForDemo}
      />
    </div>
  );
};

export default ProductDetailPage;

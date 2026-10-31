import React, { useState, useEffect } from 'react';
import { serviceApi, inquiryApi } from '../services/api';
import {
  Code2,
  Globe,
  Smartphone,
  Cpu,
  Palette,
  Database,
  ShieldCheck,
  Compass,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
  Send,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

export const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    budget: '$5,000 - $15,000',
    message: '',
  });

  useEffect(() => {
    serviceApi.getAll().then((res) => {
      if (res.data.success) setServices(res.data.data);
    }).catch(() => {});
  }, []);

  const openInquiryModal = (service) => {
    setSelectedService(service);
    setFormSubmitted(false);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inquiryApi.submit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        title: `Service Inquiry: ${selectedService?.title || 'Custom Development'}`,
        message: formData.message || `Customer requested service inquiry for ${selectedService?.title}.`,
        budget: formData.budget,
        serviceId: selectedService?.id || null,
      });
      setFormSubmitted(true);
    } catch (err) {
      alert('Failed to submit inquiry. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-20 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Expertise & Offerings</span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight">
          Our Software Engineering Services
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          We provide end-to-end software development and digital solutions tailored to your organization's exact business logic and scaling needs.
        </p>
      </section>

      {/* Services List */}
      <section className="space-y-16">
        {services.map((service, idx) => {
          const Icon = iconMap[service.icon] || Code2;

          return (
            <div
              key={service.id}
              id={service.slug}
              className="p-8 sm:p-12 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800/80 hover:border-brand-blue/40 transition-all duration-300 space-y-8 hover:shadow-soft"
            >
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-glow-blue flex-shrink-0">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-brand-blue dark:text-brand-cyan">Service 0{idx + 1}</span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      {service.title}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openInquiryModal(service)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-glow-blue transition-all"
                  >
                    Request This Service
                  </button>
                  <Link
                    to="/ai-assistant"
                    className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-brand-blue dark:hover:border-brand-cyan text-slate-700 dark:text-slate-300 hover:text-brand-blue dark:hover:text-white text-sm font-semibold flex items-center gap-1.5 transition-colors bg-white dark:bg-transparent shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                    <span>Plan with AI</span>
                  </Link>
                </div>
              </div>

              {/* Service Description */}
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                {service.description}
              </p>

              {/* 3-Column Breakdown: Problems Solved, Benefits, Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Problems Solved */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-red-400 font-bold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Problems It Solves</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {service.problemsSolv?.map((prob, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-500 dark:text-red-400 font-bold">•</span>
                        <span>{prob}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Key Benefits</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {service.benefits?.map((ben, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Features & Deliverables */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-brand-blue dark:text-brand-cyan font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Core Features</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {service.features?.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-brand-blue dark:text-brand-cyan font-bold">✦</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Technologies Used */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mr-2">Technologies:</span>
                {service.technologies?.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium text-slate-800 dark:text-brand-cyan border border-slate-200 dark:border-slate-700/60"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Inquiry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {formSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Inquiry Received!</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Thank you for reaching out regarding <span className="text-brand-blue dark:text-brand-cyan font-semibold">{selectedService?.title}</span>. Our lead architect will review your request and contact you within 24 hours.
                </p>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-brand-blue dark:text-brand-cyan uppercase font-bold">Request Service</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedService?.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Fill out this quick form and our solutions team will be in touch.</p>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@company.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Phone (Optional)</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Company / Organization</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company Name"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Estimated Budget Range</label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan text-sm"
                    >
                      <option value="Under $5,000">Under $5,000</option>
                      <option value="$5,000 - $15,000">$5,000 - $15,000</option>
                      <option value="$15,000 - $35,000">$15,000 - $35,000</option>
                      <option value="$35,000+">$35,000+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Project Notes / Requirements</label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe what you want to achieve or specific workflows you need..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-glow-blue flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    {submitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Service Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;

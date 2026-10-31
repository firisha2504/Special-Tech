import React, { useState } from 'react';
import { demoRequestApi } from '../../services/api';
import { X, Send, Sparkles, CheckCircle2, Building, Mail, Phone, User, MessageSquare } from 'lucide-react';

export const DemoRequestModal = ({ isOpen, onClose, product = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    requirements: '',
    productId: product?.id || '',
    productName: product?.name || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await demoRequestApi.submit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        productId: product?.id || formData.productId || null,
        productName: product?.name || formData.productName || null,
        requirements: formData.requirements || null,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit demo request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      requirements: '',
      productId: '',
      productName: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Demo Request Received!</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
              Thank you, <span className="font-semibold text-slate-900 dark:text-white">{formData.name}</span>. Our enterprise solutions architect has received your request for{' '}
              <span className="font-semibold text-brand-blue dark:text-brand-cyan">
                {product?.name || formData.productName || 'Special Tech Solutions'}
              </span>
              . We will reach out within 24 business hours to schedule your interactive demonstration.
            </p>
            <div className="pt-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm shadow-md hover:shadow-glow-blue transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue/10 dark:bg-brand-cyan/15 text-brand-blue dark:text-brand-cyan mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Live Product Walkthrough</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Request a Demo {product ? `for ${product.name}` : ''}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Experience our production software solutions firsthand with a dedicated technical engineer.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Work Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="sarah@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Company / Organization
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Meridian Capital"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400"
                  />
                </div>
              </div>

              {!product && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Product of Interest
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g. SpecialFlow AI, OmniPulse ERP"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tell us about your requirements or use case
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={3}
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="What business goals or workflows are you looking to streamline?"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold shadow-md hover:shadow-glow-blue transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Schedule My Demo'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoRequestModal;

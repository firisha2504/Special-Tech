import React, { useState } from 'react';
import { inquiryApi } from '../services/api';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    serviceCategory: 'Custom Software Development',
    budget: '$15,000 - $35,000',
    message: '',
    preferredContact: 'Email',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await inquiryApi.submit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        title: formData.subject || 'Direct Contact Form Submission',
        message: `[Category: ${formData.serviceCategory}] ${formData.message}`,
        budget: formData.budget,
        preferredContact: formData.preferredContact,
      });

      if (res.data.success) {
        setSubmittedInquiry(res.data);
      }
    } catch (err) {
      alert('Failed to send message. Please ensure all required fields are filled.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-brand-blue dark:text-brand-cyan text-xs font-bold tracking-widest uppercase">Get In Touch</span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight">
          Let’s Build Something Great Together
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          Have an upcoming software project or question? Send us your requirements and our solutions engineering team will get back to you within 24 hours.
        </p>
      </section>

      {/* Main Contact Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Direct Contact Info */}
        <div className="lg:col-span-5 space-y-8">
          <div className="p-8 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 space-y-6 hover:shadow-soft">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Direct Channels
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Reach our enterprise architecture team directly via email, phone, or schedule an in-person meeting at our technology center.
            </p>

            <div className="space-y-5 text-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Email Inquiries</div>
                  <a href="mailto:contact@specialtech.com" className="text-slate-900 dark:text-white font-semibold hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                    contact@specialtech.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-brand-cyan/20 text-brand-blue dark:text-brand-cyan flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Direct Telephone & WhatsApp</div>
                  <a href="tel:+15553827000" className="text-slate-900 dark:text-white font-semibold hover:text-brand-blue dark:hover:text-brand-cyan transition-colors">
                    +1 (555) 382-7000
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-brand-violet/20 text-violet-600 dark:text-brand-violet flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Headquarters</div>
                  <div className="text-slate-900 dark:text-white font-semibold leading-relaxed">
                    Silicon Horizon Tech Park<br />
                    400 Innovation Way, Suite 800
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Operating Hours</div>
                  <div className="text-slate-900 dark:text-white font-semibold">
                    Mon - Fri: 8:00 AM - 6:00 PM EST<br />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Emergency SLA: 24/7 Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Banner Shortcut */}
          <div className="p-6 rounded-3xl bg-gradient-to-tr from-blue-50 to-cyan-50 dark:from-blue-900/60 dark:to-cyan-900/40 border border-blue-200 dark:border-brand-cyan/30 space-y-3 shadow-soft">
            <div className="flex items-center gap-2 text-brand-blue dark:text-brand-cyan text-xs font-bold uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Faster Alternative</span>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Have a software idea right now?</h4>
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              Skip typing a generic email. Chat with our AI Project Assistant to generate a complete system specification and clickable prototype in under 3 minutes.
            </p>
            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline pt-1"
            >
              <span>Launch AI Project Assistant</span>
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Contact & Proposal Form */}
        <div className="lg:col-span-7">
          <div className="p-8 sm:p-10 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 relative hover:shadow-soft">
            {submittedInquiry ? (
              <div className="text-center py-12 space-y-5 animate-fadeIn">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Message & Inquiry Received!</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="text-slate-900 dark:text-white font-semibold">{formData.name}</span>. Your inquiry has been registered under reference:
                </p>
                <div className="inline-block px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-brand-blue/30 dark:border-brand-cyan/40 font-mono text-brand-blue dark:text-brand-cyan text-sm font-bold">
                  {submittedInquiry.inquiryNumber}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  A confirmation email has been dispatched. Our team will contact you via {formData.preferredContact}.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSubmittedInquiry(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        company: '',
                        subject: '',
                        serviceCategory: 'Custom Software Development',
                        budget: '$15,000 - $35,000',
                        message: '',
                        preferredContact: 'Email',
                      });
                    }}
                    className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors"
                  >
                    Submit Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Project Inquiry Form</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      placeholder="Organization Name"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Service Required</label>
                    <select
                      value={formData.serviceCategory}
                      onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan shadow-sm"
                    >
                      <option value="Custom Software Development">Custom Software Development</option>
                      <option value="Web Application Development">Web Application Development</option>
                      <option value="Mobile Application Development">Mobile Application Development</option>
                      <option value="AI Integration & Automation">AI Integration & Automation</option>
                      <option value="UI/UX Design & Prototyping">UI/UX Design & Prototyping</option>
                      <option value="Database Design & Management">Database Design & Management</option>
                      <option value="System Maintenance & Support">System Maintenance & Support</option>
                      <option value="IT Consulting & Architecture">IT Consulting & Architecture</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estimated Budget</label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan shadow-sm"
                    >
                      <option value="Under $10,000">Under $10,000</option>
                      <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                      <option value="$25,000 - $50,000">$25,000 - $50,000</option>
                      <option value="$50,000+">$50,000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject / Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Cloud ERP Implementation"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Requirements / Details *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about the problem you are solving, target users, preferred timeline..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan shadow-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-brand-blue to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-glow-blue flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    {submitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Project Proposal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

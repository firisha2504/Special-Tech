import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  FileText,
  Clock,
  User,
  Mail,
  Building,
  DollarSign,
  Tag,
  Bell,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { inquiryApi } from '../../services/api';

const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return email || 'N/A';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  const visiblePrefix = user.slice(0, 1);
  const visibleSuffix = user.slice(-1);
  const stars = '*'.repeat(Math.min(user.length - 2, 4));
  return `${visiblePrefix}${stars}${visibleSuffix}@${domain}`;
};

const STATUS_OPTIONS = [
  {
    value: 'NEW',
    label: 'New Inquiry',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    activeBg: 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/40',
    description: 'Initial submission received, awaiting staff assignment',
    dot: 'bg-blue-500',
  },
  {
    value: 'UNDER_REVIEW',
    label: 'Under Review',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    activeBg: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/40',
    description: 'Technical scope and project feasibility being evaluated',
    dot: 'bg-amber-500',
  },
  {
    value: 'ESTIMATED',
    label: 'Estimated / Proposed',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    activeBg: 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/40',
    description: 'Cost estimate & project proposal formulated or delivered',
    dot: 'bg-purple-500',
  },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    activeBg: 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-2 ring-cyan-500/40',
    description: 'Active engineering, design, or architecture development',
    dot: 'bg-cyan-500',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    activeBg: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40',
    description: 'Project delivered, requirements fulfilled, and closed',
    dot: 'bg-emerald-500',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    activeBg: 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/40',
    description: 'Inquiry archived or declined by client or Special Tech',
    dot: 'bg-rose-500',
  },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600 dark:text-blue-400 border-blue-400/50' },
  { value: 'HIGH', label: 'High', color: 'text-amber-600 dark:text-amber-400 border-amber-400/50' },
  { value: 'URGENT', label: 'Urgent', color: 'text-rose-600 dark:text-rose-400 border-rose-400/50' },
];

export const InquiryStatusModal = ({ inquiry, isOpen, onClose, onSuccess }) => {
  const [status, setStatus] = useState('NEW');
  const [internalNotes, setInternalNotes] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState(null);
  const [retryingEmail, setRetryingEmail] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (inquiry && isOpen) {
      setStatus(inquiry.status || 'NEW');
      setInternalNotes(inquiry.internalNotes || '');
      setPriority(inquiry.priority || 'MEDIUM');
      setDeliveryResult(null);
      setRetryingEmail(false);
      setRetryFeedback(null);
      setError('');
    }
  }, [inquiry, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !retryingEmail) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, retryingEmail, onClose]);

  if (!isOpen || !inquiry) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setRetryFeedback(null);

    try {
      const res = await inquiryApi.updateStatus(inquiry.id, {
        status,
        internalNotes: internalNotes.trim(),
        priority,
        dispatchNotification: true,
        forceNotify: true,
      });

      if (res.data?.success) {
        const updated = res.data.data || {
          ...inquiry,
          status,
          internalNotes: internalNotes.trim(),
          priority,
        };
        setDeliveryResult(res.data.delivery || { inApp: { success: true }, email: { success: true } });
        if (onSuccess) onSuccess(updated);
      } else {
        setError(res.data?.message || 'Failed to update inquiry status');
      }
    } catch (err) {
      console.error('Inquiry status update error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update inquiry status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryEmail = async () => {
    if (retryingEmail || !inquiry?.id) return;
    setRetryingEmail(true);
    setRetryFeedback(null);

    try {
      const res = await inquiryApi.retryEmail(inquiry.id, {
        notes: internalNotes.trim(),
        force: false,
      });

      if (res.data?.success) {
        setDeliveryResult((prev) => ({
          ...prev,
          email: res.data.delivery,
        }));
        setRetryFeedback({
          type: 'success',
          message: res.data.message || 'Email successfully delivered and accepted by email provider!',
        });
      } else {
        setDeliveryResult((prev) => ({
          ...prev,
          email: res.data.delivery || { ...prev?.email, success: false, error: res.data?.message },
        }));
        setRetryFeedback({
          type: res.data?.alreadyDelivered ? 'warning' : 'error',
          message: res.data?.message || 'Email delivery retry failed.',
        });
      }
    } catch (err) {
      console.error('Inquiry email retry error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to retry email delivery';
      const isAlreadyDelivered = err.response?.status === 409 || err.response?.data?.alreadyDelivered;
      setRetryFeedback({
        type: isAlreadyDelivered ? 'warning' : 'error',
        message: errMsg,
      });
      if (isAlreadyDelivered && err.response?.data?.delivery) {
        setDeliveryResult((prev) => ({
          ...prev,
          email: err.response.data.delivery,
        }));
      }
    } finally {
      setRetryingEmail(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-status-modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl relative p-6 sm:p-7 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 dark:bg-cyan-500/10 text-brand-blue dark:text-cyan-400 flex items-center justify-center border border-brand-blue/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-blue dark:text-brand-cyan">
                Inquiry Management
              </span>
              <h2 id="inquiry-status-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                Update Status & Notes
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inquiry Summary Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs items-start">
          <div className="min-w-0">
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Inquiry Number</span>
            <span className="font-mono font-bold text-brand-blue dark:text-brand-cyan truncate block">{inquiry.inquiryNumber}</span>
          </div>
          <div className="min-w-0">
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Customer</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {inquiry.customer?.name || 'Customer'}
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Email</span>
            <span
              className="text-slate-600 dark:text-slate-400 font-mono text-[11px] break-all block"
              title={inquiry.customer?.email || 'N/A'}
            >
              {inquiry.customer?.email || 'N/A'}
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Budget</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold block">
              {inquiry.budget || 'Unspecified'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Delivery Report View or Form */}
        {deliveryResult ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Inquiry Status Updated: {STATUS_OPTIONS.find((o) => o.value === status)?.label || status}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* In-App Notification Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">In-App Customer Notification</span>
                  <span className="text-[10px] text-slate-400">Delivered directly to client portal</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {deliveryResult.inApp?.status === 'DELIVERED' ? '✓ Delivered' : deliveryResult.inApp?.status || '✓ Delivered'}
              </span>
            </div>

            {/* Email Notification Status */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    deliveryResult.email?.success
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Customer Email Notification
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Recipient: {deliveryResult.email?.maskedRecipient || maskEmail(deliveryResult.email?.recipient || inquiry.customer?.email)}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border flex-shrink-0 ${
                  deliveryResult.email?.success
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}>
                  {deliveryResult.email?.success
                    ? '✓ Accepted by Provider'
                    : '✗ Delivery Failed'}
                </span>
              </div>

              {/* Provider Acceptance Details */}
              {deliveryResult.email?.success ? (
                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-emerald-700 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>Provider confirmed message acceptance for immediate delivery.</span>
                  </div>
                  {deliveryResult.email?.messageId && (
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Provider Message ID: {deliveryResult.email.messageId}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400 space-y-1">
                    <div className="flex items-start gap-1.5 font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{deliveryResult.email?.error || 'Provider rejected email dispatch.'}</span>
                    </div>
                    {deliveryResult.email?.error?.includes('Testing Mode') && (
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1.5 pl-5 leading-relaxed bg-black/5 dark:bg-white/5 p-2 rounded-md">
                        <strong>Provider Requirement:</strong> Your Resend account is currently in Testing Mode. While in testing mode, Resend allows outbound delivery only to the verified account owner email ({maskEmail(inquiry.customer?.email)}). To deliver to external customer domains, verify a sending domain in your Resend dashboard (<a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline text-brand-blue dark:text-brand-cyan">resend.com/domains</a>).
                      </p>
                    )}
                  </div>

                  {/* Retry Action */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">
                      Need to re-dispatch email to the customer?
                    </span>
                    <button
                      type="button"
                      onClick={handleRetryEmail}
                      disabled={retryingEmail}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${retryingEmail ? 'animate-spin' : ''}`} />
                      <span>{retryingEmail ? 'Retrying Delivery...' : 'Retry Email Delivery'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Retry feedback toast if triggered */}
              {retryFeedback && (
                <div className={`p-2.5 rounded-lg text-[11px] flex items-center gap-2 border animate-fade-in ${
                  retryFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : retryFeedback.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}>
                  {retryFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{retryFeedback.message}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Selection Cards */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Select Workflow Status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`text-left p-3 rounded-2xl border transition-all relative flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? opt.activeBg
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                          <span className="font-bold text-xs">{opt.label}</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-brand-blue text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Level */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Priority Level
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((p) => {
                  const isSelected = priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm'
                          : `${p.color} bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800`
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="inquiry-notes-textarea" className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Optional Update Notes for Customer
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Included in email & in-app alerts
                </span>
              </div>
              <textarea
                id="inquiry-notes-textarea"
                rows={4}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Record follow-up actions, budget discussions, technical agreements, or next milestone dates..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors leading-relaxed"
              />
              <div className="text-[11px] text-slate-400 flex justify-between items-center px-1">
                <span>{internalNotes.length} characters</span>
                <span>Updates will be delivered to customer and recorded in audit logs</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-glow-blue transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating & Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Update & Dispatch Notification</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InquiryStatusModal;

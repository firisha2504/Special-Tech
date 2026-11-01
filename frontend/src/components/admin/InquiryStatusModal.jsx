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
  Send,
  ShieldCheck,
  ArrowRight,
  History,
} from 'lucide-react';
import { inquiryApi, adminApi } from '../../services/api';

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
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'telemetry'
  const [activeProvider, setActiveProvider] = useState('Gmail SMTP');
  const [deliveryResult, setDeliveryResult] = useState(null);
  const [retryingEmail, setRetryingEmail] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (inquiry && isOpen) {
      setStatus(inquiry.status || 'NEW');
      setInternalNotes(inquiry.internalNotes || '');
      setPriority(inquiry.priority || 'MEDIUM');
      setRetryingEmail(false);
      setRetryFeedback(null);
      setError('');

      // Fetch active SMTP configuration to resolve currently selected provider
      const fetchEmailConfig = adminApi.getEmailSettings || adminApi.getEmailStatus;
      if (typeof fetchEmailConfig === 'function') {
        fetchEmailConfig()
          .then((res) => {
            if (res.data?.success && res.data?.data?.providerName) {
              setActiveProvider(res.data.data.providerName);
            }
          })
          .catch(() => {});
      }

      // Seed delivery telemetry if inquiry already has a recent email notification record
      if (inquiry.latestEmailNotification) {
        const notif = inquiry.latestEmailNotification;
        const details = notif.deliveryDetails || {};
        const isSent = notif.deliveryStatus === 'SENT' || notif.deliveryStatus === 'DELIVERED';
        setDeliveryResult({
          inApp: { status: 'DELIVERED', success: true },
          email: {
            success: isSent,
            status: isSent ? 'Sent' : 'Failed',
            provider: details.provider || 'Resend SMTP',
            originalProvider: details.originalProvider || details.provider || 'Resend SMTP',
            messageId: details.providerMessageId || null,
            error: details.errorMessage || null,
            errorType: details.errorType || null,
            recipient: details.recipientEmail || inquiry.customer?.email,
            maskedRecipient: details.maskedRecipientEmail || maskEmail(inquiry.customer?.email),
            providerAccountOwner: details.providerAccountOwner || 'naniabdi2504@gmail.com',
            attempts: details.attempts || [],
          },
        });
        setActiveTab('telemetry');
      } else {
        setDeliveryResult(null);
        setActiveTab('form');
      }
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
        setActiveTab('telemetry');
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
        const deliveryData = res.data.delivery || res.data.notification?.deliveryDetails || {};
        const usedProvider = deliveryData.provider || activeProvider;
        const msgId = deliveryData.messageId || deliveryData.providerMessageId || null;

        setDeliveryResult((prev) => ({
          ...prev,
          email: {
            ...deliveryData,
            success: true,
            status: 'Sent',
            provider: usedProvider,
            originalProvider: deliveryData.originalProvider || prev?.email?.originalProvider || 'Resend SMTP',
            recipient: deliveryData.recipientEmail || inquiry.customer?.email,
            messageId: msgId,
            attempts: deliveryData.attempts || prev?.email?.attempts || [],
          },
        }));

        setRetryFeedback({
          type: 'success',
          message: res.data.message || `Email successfully retried and accepted by ${usedProvider}! (Message ID: ${msgId || 'Confirmed'})`,
        });

        if (onSuccess) {
          onSuccess({
            ...inquiry,
            latestEmailNotification: res.data.notification,
          });
        }
      } else {
        const deliveryData = res.data.delivery || res.data.notification?.deliveryDetails || {};
        setDeliveryResult((prev) => ({
          ...prev,
          email: {
            ...prev?.email,
            ...deliveryData,
            success: false,
            status: 'Failed',
            error: res.data?.message || deliveryData.error,
          },
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
          email: {
            ...prev?.email,
            ...err.response.data.delivery,
            success: true,
            status: 'Sent',
          },
        }));
      }
    } finally {
      setRetryingEmail(false);
    }
  };

  const customerRecipient = inquiry.customer?.email || 'N/A';
  const originalFailedProvider = deliveryResult?.email?.originalProvider || deliveryResult?.email?.provider || 'Resend SMTP';
  const successfulProvider = deliveryResult?.email?.success ? (deliveryResult.email.provider || activeProvider) : null;
  const providerOwner = deliveryResult?.email?.providerAccountOwner || 'naniabdi2504@gmail.com';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => {
        if (!isSubmitting && !retryingEmail) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-status-modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl relative p-6 sm:p-7 space-y-5"
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
                Update Status & Email Telemetry
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || retryingEmail}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
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
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Customer Email</span>
            <span
              className="text-slate-900 dark:text-white font-mono font-bold text-[11px] break-all block"
              title={customerRecipient}
            >
              {customerRecipient}
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Current Status</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 block">
              {inquiry.status || 'NEW'}
            </span>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Workflow Status Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Notification Telemetry & Retry</span>
            {deliveryResult?.email && (
              <span
                className={`w-2 h-2 rounded-full ${
                  deliveryResult.email.success ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            )}
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* TAB 1: EMAIL NOTIFICATION TELEMETRY & RETRY SECTION */}
        {activeTab === 'telemetry' ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Bell className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                <span>Customer Notification Telemetry</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                Inquiry #{inquiry.inquiryNumber} ({inquiry.status})
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
                  <span className="text-[10px] text-slate-400">Delivered directly to client dashboard</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ✓ Delivered
              </span>
            </div>

            {/* Customer Email Notification Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      deliveryResult?.email?.success
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      Customer Email Notification
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Outbound SMTP Dispatch Record
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border flex-shrink-0 inline-flex items-center gap-1.5 ${
                    deliveryResult?.email?.success
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      deliveryResult?.email?.success ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>{deliveryResult?.email?.success ? '✓ Accepted by Provider' : '✗ Delivery Failed'}</span>
                </span>
              </div>

              {/* Provider & Recipient Metadata Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px]">
                {/* 1. Actual Customer Recipient */}
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block">
                    Actual Customer Recipient
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 dark:text-white break-all">
                      {customerRecipient}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                      Customer
                    </span>
                  </div>
                </div>

                {/* 2. Original Failed Provider */}
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block">
                    Original Failed Provider
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {originalFailedProvider}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                      Initial Attempt
                    </span>
                  </div>
                </div>

                {/* 3. Provider Selected for Next Retry */}
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block">
                    Provider Selected for Next Retry
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-brand-blue dark:text-brand-cyan">
                      {activeProvider}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-blue-500/10 text-brand-blue dark:text-brand-cyan border border-brand-blue/20 font-bold">
                      Active SMTP
                    </span>
                  </div>
                </div>

                {/* 4. Provider Used for Successful Retry */}
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block">
                    Successful Retry Provider
                  </span>
                  {successfulProvider ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {successfulProvider}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                        Delivered
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px] italic">
                      Awaiting Retry Execution
                    </span>
                  )}
                </div>
              </div>

              {/* Provider Acceptance Details */}
              {deliveryResult?.email?.success ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Email successfully accepted by {successfulProvider || activeProvider} for delivery.</span>
                  </div>
                  {deliveryResult.email?.messageId && (
                    <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                      <strong>Provider Message ID:</strong> {deliveryResult.email.messageId}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Detailed Failure Diagnostics */}
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400 space-y-2">
                    <div className="flex items-start gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{deliveryResult?.email?.error || 'Provider rejected initial email dispatch attempt.'}</span>
                    </div>

                    {/* Resend Testing Mode Specific Information Box */}
                    {deliveryResult?.email?.error?.includes('Testing Mode') && (
                      <div className="text-[10px] text-slate-700 dark:text-slate-300 pl-6 space-y-2 leading-relaxed bg-black/5 dark:bg-white/5 p-2.5 rounded-lg border border-rose-500/15">
                        <div>
                          <strong className="text-rose-600 dark:text-rose-400">Resend Testing Mode (550) Diagnostic:</strong>
                          <p className="mt-0.5">
                            The Resend account is operating in <em>Testing Mode</em>. While in testing mode, Resend permits outbound email delivery exclusively to the verified account owner (<strong>{providerOwner}</strong>). External customer addresses such as <strong>{customerRecipient}</strong> are automatically rejected.
                          </p>
                        </div>
                        <div className="p-2 rounded bg-blue-500/10 text-brand-blue dark:text-brand-cyan border border-blue-500/20 font-medium">
                          💡 <strong>SMTP Provider Switching Fix:</strong> To successfully deliver this notification to customer <strong>{customerRecipient}</strong>, ensure the active SMTP provider is set to <strong>Gmail SMTP</strong>, then click <em>Retry Email Delivery</em> below.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Retry Action Trigger */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Re-dispatch to Customer
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Will deliver to <strong>{customerRecipient}</strong> via <strong>{activeProvider}</strong>.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRetryEmail}
                      disabled={retryingEmail}
                      className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md hover:shadow-glow-blue flex-shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${retryingEmail ? 'animate-spin' : ''}`} />
                      <span>{retryingEmail ? `Retrying via ${activeProvider}...` : 'Retry Email Delivery'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Retry feedback toast if triggered */}
              {retryFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border animate-fade-in ${
                    retryFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : retryFeedback.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {retryFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <span className="font-bold block">
                      {retryFeedback.type === 'success' ? 'Delivery Succeeded' : 'Retry Notice'}
                    </span>
                    <span className="leading-relaxed">{retryFeedback.message}</span>
                  </div>
                </div>
              )}

              {/* Audit Attempt History */}
              {deliveryResult?.email?.attempts?.length > 1 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono font-bold uppercase">
                    <History className="w-3.5 h-3.5" />
                    <span>Delivery Audit Trail ({deliveryResult.email.attempts.length} attempts)</span>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {deliveryResult.email.attempts.map((att, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            #{att.attemptNumber || idx + 1}
                          </span>
                          <span className="text-slate-500">{att.provider}</span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            att.deliveryStatus === 'SENT'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {att.deliveryStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="text-xs text-brand-blue dark:text-brand-cyan hover:underline font-semibold cursor-pointer"
              >
                &larr; Return to Status Form
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          /* TAB 2: WORKFLOW STATUS UPDATE FORM */
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            {/* Status Selection Cards */}
            <div className="space-y-2">
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
                <label
                  htmlFor="inquiry-notes-textarea"
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide"
                >
                  Optional Update Notes for Customer
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Included in email & in-app alerts
                </span>
              </div>
              <textarea
                id="inquiry-notes-textarea"
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Record follow-up actions, budget discussions, technical agreements, or next milestone dates..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
              {deliveryResult?.email && (
                <button
                  type="button"
                  onClick={() => setActiveTab('telemetry')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
                >
                  View Email Telemetry &rarr;
                </button>
              )}

              <div className="flex items-center gap-3 ml-auto">
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
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InquiryStatusModal;

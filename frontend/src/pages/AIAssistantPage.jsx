import React, { useState, useEffect, useRef } from 'react';
import { aiApi, prototypeApi, inquiryApi } from '../services/api';
import PrototypeWorkspace from '../features/prototype/PrototypeWorkspace';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  Download,
  CheckCircle2,
  FileText,
  Laptop,
  ArrowRight,
  X,
  Layers,
  ChevronRight,
  Shield,
  HelpCircle,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'I need a school management system.',
  'I want to build an e-commerce website.',
  'I need an inventory management system.',
  'I need a hospital & clinic management system.',
  'I have a business idea but don\'t know where to start.',
];

export const AIAssistantPage = () => {
  const [sessionToken, setSessionToken] = useState(() => {
    let t = localStorage.getItem('special_tech_ai_session');
    if (!t) {
      t = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('special_tech_ai_session', t);
    }
    return t;
  });

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'spec' | 'prototype'
  const [requirement, setRequirement] = useState(null);
  const [prototypeData, setPrototypeData] = useState(null);
  const [generatingSpec, setGeneratingSpec] = useState(false);
  const [generatingPrototype, setGeneratingPrototype] = useState(false);
  const [aiProviderInfo, setAiProviderInfo] = useState({ provider: 'built-in', model: 'Special Tech Software Analyst' });

  // Customer Submission Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    budget: '$15,000 - $35,000',
    preferredContact: 'Email & Phone',
    notes: '',
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    try {
      aiApi.getStatus().then((res) => {
        if (res.data?.success) setAiProviderInfo(res.data);
      }).catch(() => {});

      const res = await aiApi.startConversation({ sessionToken });
      if (res.data.success) {
        setConversation(res.data.conversation);
        setMessages(res.data.conversation.messages || []);
        if (res.data.conversation.requirements?.length > 0) {
          setRequirement(res.data.conversation.requirements[0]);
        }
        if (res.data.conversation.prototypes?.length > 0) {
          const proto = res.data.conversation.prototypes[0];
          setPrototypeData({
            prototype: proto,
            currentVersion: proto.versions?.[0] || {},
            configuration: proto.versions?.[0]?.configuration || {},
          });
        }
      }
    } catch (err) {
      console.error('Failed to init conversation:', err);
    }
  };

  const handleSendMessage = async (msgText) => {
    const textToSend = msgText || inputMessage;
    if (!textToSend.trim() || sending) return;

    // Optimistically add user message
    const tempUserMsg = {
      id: `temp_${Date.now()}`,
      sender: 'USER',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setSending(true);

    try {
      const res = await aiApi.sendMessage({
        conversationId: conversation?.id,
        sessionToken,
        message: textToSend,
      });

      if (res.data.success) {
        if (res.data.metadata) {
          setAiProviderInfo(res.data.metadata);
        }
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          res.data.userMessage,
          res.data.aiMessage,
        ]);

        // Auto-generate specification and prototype if conversation reaches 3 messages
        if (messages.length >= 2 && !requirement) {
          triggerAutoGeneration(conversation?.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const triggerAutoGeneration = async (convId) => {
    const id = convId || conversation?.id;
    if (!id) return;

    setGeneratingSpec(true);
    try {
      const specRes = await aiApi.generateSpecification({ conversationId: id });
      if (specRes.data.success) {
        setRequirement(specRes.data.data);
      }

      const protoRes = await prototypeApi.generate({ conversationId: id });
      if (protoRes.data.success) {
        setPrototypeData(protoRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSpec(false);
    }
  };

  const handleManualGeneratePrototype = async () => {
    if (!conversation?.id) return;
    setGeneratingPrototype(true);
    try {
      if (!requirement) {
        const specRes = await aiApi.generateSpecification({ conversationId: conversation.id });
        if (specRes.data.success) setRequirement(specRes.data.data);
      }

      const protoRes = await prototypeApi.generate({ conversationId: conversation.id });
      if (protoRes.data.success) {
        setPrototypeData(protoRes.data.data);
        setActiveTab('prototype');
      }
    } catch (err) {
      alert('Failed to generate prototype: ' + err.message);
    } finally {
      setGeneratingPrototype(false);
    }
  };

  const handlePrototypeModify = async (prompt) => {
    if (!prototypeData?.prototype?.id) return;
    const res = await prototypeApi.modify({
      prototypeId: prototypeData.prototype.id,
      prompt,
    });
    if (res.data.success) {
      setPrototypeData(res.data.data);
    }
  };

  const handleResetSession = () => {
    localStorage.removeItem('special_tech_ai_session');
    const newT = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('special_tech_ai_session', newT);
    setSessionToken(newT);
    setConversation(null);
    setMessages([]);
    setRequirement(null);
    setPrototypeData(null);
    setActiveTab('chat');
    setTimeout(() => {
      aiApi.startConversation({ sessionToken: newT }).then((res) => {
        if (res.data.success) {
          setConversation(res.data.conversation);
          setMessages(res.data.conversation.messages || []);
        }
      });
    }, 100);
  };

  const handleCustomerSubmitInquiry = async (e) => {
    e.preventDefault();
    setSubmittingInquiry(true);

    try {
      const res = await inquiryApi.submit({
        name: customerForm.name,
        email: customerForm.email,
        phone: customerForm.phone || null,
        company: customerForm.company || null,
        title: requirement?.projectName || 'Custom Software Implementation',
        message: `${requirement?.overview || 'Customer submitted project via AI Assistant.'}\n\nClient Notes: ${customerForm.notes || 'None'}`,
        budget: customerForm.budget,
        preferredContact: customerForm.preferredContact,
        requirementId: requirement?.id || null,
        prototypeVersionId: prototypeData?.currentVersion?.id || null,
      });

      if (res.data.success) {
        setSubmittedInquiry(res.data);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit project. Please verify your details.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const downloadSpecificationPdf = () => {
    if (!submittedInquiry?.inquiryId) {
      alert('Please submit your project inquiry first to download the formal registered PDF specification.');
      setSubmitModalOpen(true);
      return;
    }
    window.open(inquiryApi.getPdfUrl(submittedInquiry.inquiryId), '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Workflow Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 hover:shadow-soft">
        <div className="flex items-center gap-3">
          <img
            src="/logo/special-tech-icon.png"
            alt="Special Tech"
            className="w-10 h-10 rounded-xl object-contain shadow-glow-cyan border border-brand-cardBorder flex-shrink-0"
          />
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>Special AI — Software Analyst</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Engine: {aiProviderInfo?.provider === 'built-in' ? 'Special Tech Built-In Analyst (Heuristic NLP)' : aiProviderInfo?.provider === 'gemini' ? 'Google Gemini AI' : 'OpenAI GPT'}
              </span>
              {aiProviderInfo?.isFallback && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Fallback Mode Active
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">Describe your idea. Our AI plans your requirements and builds an interactive prototype.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 sm:flex-none justify-center px-2.5 sm:px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>1. Discovery Chat</span>
          </button>

          <button
            onClick={() => {
              if (!requirement && conversation) triggerAutoGeneration(conversation.id);
              setActiveTab('spec');
            }}
            className={`flex-1 sm:flex-none justify-center px-2.5 sm:px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'spec'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Project Spec</span>
            {requirement && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
          </button>

          <button
            onClick={() => {
              if (!prototypeData) handleManualGeneratePrototype();
              else setActiveTab('prototype');
            }}
            id="tab-btn-prototype"
            className={`w-full sm:w-auto justify-center px-2.5 sm:px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'prototype'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>3. Interactive Prototype</span>
            {prototypeData && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={handleResetSession}
            title="Start New Discovery Conversation"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-auto sm:ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* VIEW 1: CONVERSATION CHAT INTERFACE */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
          {/* Main Chat Area */}
          <div className="lg:col-span-8 flex flex-col justify-between rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-hidden relative shadow-2xl hover:shadow-soft">
            {/* Messages Scroll View */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[520px]">
              {messages.map((msg) => {
                const isAI = msg.sender === 'ASSISTANT';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAI && (
                      <img
                        src="/logo/special-tech-icon.png"
                        alt="Special AI"
                        className="w-8 h-8 rounded-xl object-contain shadow-glow-cyan flex-shrink-0 mt-0.5 border border-brand-cyan/20"
                      />
                    )}
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAI
                          ? 'bg-slate-100 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-sm shadow-sm'
                          : 'bg-gradient-to-r from-blue-600 to-brand-blue text-white rounded-tr-sm shadow-glow-blue'
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.content}</div>
                    </div>
                    {!isAI && (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {sending && (
                <div className="flex items-center gap-3">
                  <img
                    src="/logo/special-tech-icon.png"
                    alt="Special AI"
                    className="w-8 h-8 rounded-xl object-contain shadow-glow-cyan flex-shrink-0 border border-brand-cyan/20"
                  />
                  <div className="bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-2 font-mono text-[11px]">Special AI analyzing requirements...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompt Chips */}
            {messages.length <= 3 && (
              <div className="py-3 border-t border-slate-200 dark:border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">Suggested Ideas to explore:</span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 hover:text-brand-blue dark:text-slate-300 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700/80 text-xs font-medium transition-all text-left shadow-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Explain your software idea or answer AI follow-up questions..."
                className="flex-1 px-4 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
              />
              <button
                type="submit"
                disabled={sending || !inputMessage.trim()}
                className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-glow-blue disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Live Discovery Summary Panel */}
          <div className="lg:col-span-4 rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-6 shadow-2xl hover:shadow-soft">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                  <span>Real-Time Blueprint</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan font-semibold">
                  AI Business Analyst
                </span>
              </div>

              {requirement ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">Project Identified:</span>
                    <span className="text-slate-900 dark:text-white font-bold text-sm text-brand-blue dark:text-brand-cyan">{requirement.projectName}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-0.5">Overview:</span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">{requirement.overview}</p>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Identified Modules ({requirement.modules?.length || 0}):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {requirement.modules?.map((m) => (
                        <span key={m.name} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">Recommended Architecture:</span>
                    <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-800/60 text-brand-blue dark:text-cyan-300 font-mono text-[10px] block font-medium">
                      PostgreSQL + Node.js + React + Tailwind
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Gathering Requirements...</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Type your idea or select a suggested topic. The AI analyst will automatically organize your system blueprint.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleManualGeneratePrototype}
                disabled={generatingPrototype}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-blue flex items-center justify-center gap-2 transition-all"
              >
                {generatingPrototype ? (
                  <span>Generating Prototype...</span>
                ) : (
                  <>
                    <Laptop className="w-4 h-4" />
                    <span>Preview Interactive Prototype</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (!requirement) triggerAutoGeneration();
                  setActiveTab('spec');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-transparent"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Full Specifications</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FULL REQUIREMENT SPECIFICATIONS */}
      {activeTab === 'spec' && (
        <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-8 shadow-2xl hover:shadow-soft">
          {requirement ? (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-blue dark:text-brand-cyan uppercase">Project Specification (v{requirement.version})</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{requirement.projectName}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('prototype')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue flex items-center gap-2"
                  >
                    <Laptop className="w-4 h-4" />
                    <span>Open Interactive Prototype</span>
                  </button>

                  <button
                    onClick={() => setSubmitModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>Submit Project</span>
                  </button>
                </div>
              </div>

              {/* 1. Overview & Problem Statement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-brand-blue dark:text-brand-cyan uppercase tracking-wider">Project Overview</h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{requirement.overview}</p>
                </div>
                <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-slate-900/80 border border-rose-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-rose-600 dark:text-red-400 uppercase tracking-wider">Problem Statement</h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{requirement.problemStatement}</p>
                </div>
              </div>

              {/* 2. Objectives */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Key Objectives</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {requirement.objectives?.map((obj, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. System Modules */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Architecture Modules</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requirement.modules?.map((mod, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm text-brand-blue dark:text-brand-cyan">{mod.name}</h5>
                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{mod.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Target Users & Roles */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">User Roles & Access Permissions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {requirement.userRoles?.map((r, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{r.role}</span>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{r.permissions}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Recommended Tech Stack */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Recommended Technology Stack</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {requirement.recommendedTech?.map((tech, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-brand-blue dark:text-brand-cyan font-bold">{tech.layer}</span>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{tech.technology}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Deliverables */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Expected Deliverables</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {requirement.deliverables?.map((del, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300">
                      <span className="text-emerald-500 dark:text-emerald-400 font-bold">✓</span>
                      <span>{del}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 space-y-4">
              <Sparkles className="w-12 h-12 mx-auto text-brand-blue dark:text-brand-cyan animate-spin-slow" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Synthesizing Project Requirements...</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Share a few messages in the Discovery Chat tab. Special AI will assemble your complete requirements document.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: INTERACTIVE PROTOTYPE WORKSPACE */}
      {activeTab === 'prototype' && (
        <div className="min-h-[750px]">
          {prototypeData ? (
            <PrototypeWorkspace
              prototypeData={prototypeData}
              onModify={handlePrototypeModify}
              onSubmitProjectClick={() => setSubmitModalOpen(true)}
              onDownloadSpec={downloadSpecificationPdf}
            />
          ) : (
            <div className="rounded-3xl glass-panel border border-slate-200 dark:border-slate-800 p-16 text-center space-y-4">
              <Laptop className="w-12 h-12 mx-auto text-brand-blue dark:text-brand-cyan animate-pulse" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Building Interactive Prototype...</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Assembling modular React components and database fixtures for your system.
              </p>
              <button
                onClick={handleManualGeneratePrototype}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs shadow-glow-blue"
              >
                Generate Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUBMISSION MODAL: SUBMIT PROJECT TO SPECIAL TECH */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setSubmitModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {submittedInquiry ? (
              <div className="text-center py-6 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Project Proposal Registered!</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Your project requirements and prototype configuration have been safely linked and submitted to Special Tech.
                </p>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Inquiry Number:</span>
                    <span className="text-brand-blue dark:text-brand-cyan font-bold">{submittedInquiry.inquiryNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Under Engineering Review</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lead Architect:</span>
                    <span className="text-slate-900 dark:text-white font-semibold">Special Tech Engineering Team</span>
                  </div>
                </div>

                {/* What Happens Next Guide */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-left text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue dark:bg-cyan-400" />
                    <span>What happens next?</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li>Our Senior Solutions Architect inspects your requirements blueprint and prototype.</li>
                    <li>We will reach out to you within 24 hours via your preferred contact method.</li>
                    <li>You will receive a formal architectural proposal, technical quote, and delivery timeline.</li>
                  </ol>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center">
                  <button
                    onClick={() => window.open(inquiryApi.getPdfUrl(submittedInquiry.inquiryId), '_blank')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-blue"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Project Spec (PDF)</span>
                  </button>
                  <button
                    onClick={() => setSubmitModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-transparent transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCustomerSubmitInquiry} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-brand-blue dark:text-brand-cyan uppercase font-bold">Formal Submission</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Submit Project to Special Tech</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    We will review your AI specification and interactive prototype to prepare your engineering quote.
                  </p>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Johnson"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. alex@company.com"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 000-0000"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Company / Organization</label>
                    <input
                      type="text"
                      placeholder="Company or School Name"
                      value={customerForm.company}
                      onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Estimated Budget</label>
                      <select
                        value={customerForm.budget}
                        onChange={(e) => setCustomerForm({ ...customerForm, budget: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                      >
                        <option value="Under $10,000">Under $10,000</option>
                        <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                        <option value="$25,000 - $50,000">$25,000 - $50,000</option>
                        <option value="$50,000+">$50,000+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Preferred Contact</label>
                      <select
                        value={customerForm.preferredContact}
                        onChange={(e) => setCustomerForm({ ...customerForm, preferredContact: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                      >
                        <option value="Email">Email</option>
                        <option value="Phone / WhatsApp">Phone / WhatsApp</option>
                        <option value="Google Meet">Google Meet</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Additional Project Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Any specific integrations, deadlines, or security compliance needed..."
                      value={customerForm.notes}
                      onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingInquiry}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-brand-blue to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-blue flex items-center justify-center gap-2"
                  >
                    {submittingInquiry ? (
                      <span>Registering Proposal...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Submit Project</span>
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

export default AIAssistantPage;

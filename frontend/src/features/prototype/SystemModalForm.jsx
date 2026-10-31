import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export const SystemModalForm = ({ formConfig, onClose, onSubmit, primaryColor = '#087BFF' }) => {
  if (!formConfig) return null;

  const [formState, setFormState] = useState({});

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 relative shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <span className="text-[10px] font-mono font-bold text-brand-blue dark:text-brand-cyan uppercase">Interactive UI Form</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{formConfig.title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2 text-xs">
          {formConfig.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  value={formState[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 text-xs shadow-sm"
                >
                  <option value="">Select option...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  placeholder={field.placeholder || ''}
                  value={formState[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue dark:focus:border-cyan-400 text-xs shadow-sm"
                />
              )}
            </div>
          ))}

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SystemModalForm;

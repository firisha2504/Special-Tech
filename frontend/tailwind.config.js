/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#020D20',
          dark: '#07172E',
          card: '#0B1F3A',
          cardBorder: 'rgba(60, 140, 255, 0.2)',
          blue: '#087BFF',
          electric: '#0066FF',
          cyan: '#08D9E8',
          muted: '#A7B8D0',
          lightBg: '#F8FAFC',
          lightSecondary: '#FFFFFF',
          lightSection: '#F1F5F9',
          lightCard: '#FFFFFF',
          lightBorder: '#E2E8F0',
          lightHeading: '#0F172A',
          lightBody: '#475569',
          lightSecondaryText: '#64748B',
          lightMuted: '#94A3B8',
        },
        theme: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          section: 'var(--bg-section)',
          card: 'var(--bg-card)',
          border: 'var(--border-color)',
          text: 'var(--text-primary)',
          textSec: 'var(--text-secondary)',
          textMuted: 'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -4px rgba(8, 123, 255, 0.45)',
        'glow-cyan': '0 0 25px -4px rgba(8, 217, 232, 0.45)',
        'glow-electric': '0 0 30px -4px rgba(0, 102, 255, 0.5)',
        'glass': '0 8px 32px 0 rgba(2, 13, 32, 0.6)',
        'soft-light': '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
        'card-hover-light': '0 12px 30px -4px rgba(8, 123, 255, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('light', ['.light &', '[data-theme="light"] &']);
    },
  ],
}

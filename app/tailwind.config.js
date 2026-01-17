/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cosmic Background Layers
        void: 'var(--bg-void)',
        deep: 'var(--bg-deep)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        hover: 'var(--bg-hover)',

        // Aurora Accent Palette
        accent: {
          primary: 'var(--accent-primary)',
          'primary-glow': 'var(--accent-primary-glow)',
          'primary-soft': 'var(--accent-primary-soft)',
          secondary: 'var(--accent-secondary)',
          'secondary-glow': 'var(--accent-secondary-glow)',
          tertiary: 'var(--accent-tertiary)',
          highlight: 'var(--accent-highlight)',
        },

        // Git Status Colors
        status: {
          added: 'var(--status-added)',
          'added-bg': 'var(--status-added-bg)',
          modified: 'var(--status-modified)',
          'modified-bg': 'var(--status-modified-bg)',
          deleted: 'var(--status-deleted)',
          'deleted-bg': 'var(--status-deleted-bg)',
          renamed: 'var(--status-renamed)',
          conflict: 'var(--status-conflict)',
          'conflict-bg': 'var(--status-conflict-bg)',
          untracked: 'var(--status-untracked)',
        },

        // Text Hierarchy
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          ghost: 'var(--text-ghost)',
        },

        // Branch Colors
        branch: {
          1: 'var(--branch-1)',
          2: 'var(--branch-2)',
          3: 'var(--branch-3)',
          4: 'var(--branch-4)',
          5: 'var(--branch-5)',
          6: 'var(--branch-6)',
          7: 'var(--branch-7)',
          8: 'var(--branch-8)',
          9: 'var(--branch-9)',
          10: 'var(--branch-10)',
        },
      },
      fontFamily: {
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 10px var(--accent-primary-glow)',
        'glow-md': '0 0 20px var(--accent-primary-glow)',
        'glow-lg': '0 0 40px var(--accent-primary-glow)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'flow': 'flow 3s linear infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px var(--accent-primary-glow)' },
          '50%': { boxShadow: '0 0 30px var(--accent-primary-glow)' },
        },
        flow: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        background: "var(--mv-bg)",
        foreground: "var(--mv-text)",
        mv: {
          bg: 'var(--mv-bg)',
          'bg-subtle': 'var(--mv-bg-subtle)',
          surface: 'var(--mv-surface)',
          primary: 'var(--mv-primary)',
          'primary-light': 'var(--mv-primary-light)',
          accent: 'var(--mv-accent)',
          'accent-soft': 'var(--mv-accent-soft)',
          success: 'var(--mv-success)',
          text: 'var(--mv-text)',
          'text-muted': 'var(--mv-text-muted)',
          border: 'var(--mv-border)',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'neumorphic': '6px 6px 16px rgba(0, 0, 0, 0.06), -4px -4px 12px rgba(255, 255, 255, 0.8)',
        'neumorphic-dark': '6px 6px 16px rgba(0, 0, 0, 0.3), -4px -4px 12px rgba(60, 50, 90, 0.15)',
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-violet': '0 0 20px rgba(139, 92, 246, 0.15)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

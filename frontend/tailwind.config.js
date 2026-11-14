/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        panel: '#f9fafb',
        accent: '#0f172a',
        muted: '#6b7280',
        success: '#15803d',
        warning: '#b45309',
        danger: '#b91c1c',
      },
    },
  },
  plugins: [],
};

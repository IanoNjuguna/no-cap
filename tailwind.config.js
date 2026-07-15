/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D0E11',
        card: '#161B22',
        border: '#30363D',
        mint: {
          DEFAULT: '#00FFC2',
          dim: '#00B88A',
        },
        violet: '#635BFF',
        danger: '#FF4F00',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

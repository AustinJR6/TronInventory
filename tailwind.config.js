/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tron-orange': '#FF6B00',
        'tron-orange-light': '#FF8C3A',
        'tron-orange-dark': '#CC5500',
        'tron-black': '#0A0A0A',
        'tron-gray': '#1A1A1A',
        'tron-gray-light': '#2A2A2A',
      },
    },
  },
  plugins: [],
}

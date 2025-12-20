/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode colors (original)
        'tron-orange': '#FF6B00',
        'tron-orange-light': '#FF8C3A',
        'tron-orange-dark': '#CC5500',
        'tron-black': '#0A0A0A',
        'tron-gray': '#1A1A1A',
        'tron-gray-light': '#2A2A2A',

        // Light mode colors (orange sherbet & cream)
        'cream': '#FFF5EB',
        'cream-dark': '#FFE8D6',
        'sherbet-orange': '#FFB380',
        'sherbet-orange-light': '#FFC299',
        'sherbet-orange-dark': '#FF9A66',
        'soft-gray': '#F5F5F5',
        'text-light': '#2D2D2D',
        'text-light-muted': '#666666',
      },
    },
  },
  plugins: [],
}

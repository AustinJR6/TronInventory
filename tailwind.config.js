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
        // Dark mode colors (original - keeping for backwards compatibility)
        'tron-orange': '#FF6B00',
        'tron-orange-light': '#FF8C3A',
        'tron-orange-dark': '#CC5500',
        'tron-black': '#0A0A0A',
        'tron-gray': '#1A1A1A',
        'tron-gray-light': '#2A2A2A',

        // Light mode ocean theme
        'ocean-sky': '#E6F3FF',        // Light sky blue
        'ocean-light': '#B3D9FF',      // Light ocean blue
        'ocean-medium': '#4A90E2',     // Medium ocean blue
        'ocean-accent': '#2E7BC4',     // Accent blue for buttons
        'ocean-text': '#1A4B73',       // Dark blue text
        'ocean-muted': '#5C7A99',      // Muted blue text
        'wave-white': '#FFFFFF',       // Pure white
        'foam': '#F0F8FF',             // Alice blue foam

        // Dark mode ocean theme
        'deep-ocean': '#0A1929',       // Deep ocean dark
        'ocean-dark': '#1E3A5F',       // Ocean night blue
        'ocean-deep': '#2E5C8A',       // Deeper ocean blue
        'starlight': '#4FC3F7',        // Bright starlight blue
        'starlight-glow': '#29B6F6',   // Starlight glow
        'moon-silver': '#B0BEC5',      // Silver moonlight
        'ocean-text-dark': '#E3F2FD',  // Light text on dark
        'ocean-muted-dark': '#90CAF9', // Muted text on dark
      },
      backgroundImage: {
        // Light mode gradients (bottom to top)
        'ocean-gradient': 'linear-gradient(to top, #4A90E2, #B3D9FF, #E6F3FF, #FFFFFF)',
        'ocean-gradient-subtle': 'linear-gradient(to top, #B3D9FF, #E6F3FF, #FFFFFF)',

        // Dark mode gradients (bottom to top)
        'ocean-night': 'linear-gradient(to top, #0A1929, #1E3A5F, #2E5C8A, #1A1A1A)',
        'ocean-night-subtle': 'linear-gradient(to top, #1E3A5F, #2E5C8A, #1A1A1A)',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'breathe-slow': 'breathe 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'wave': 'wave 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.95' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(79, 195, 247, 0.5), 0 0 10px rgba(79, 195, 247, 0.3)' },
          '100%': { boxShadow: '0 0 10px rgba(79, 195, 247, 0.8), 0 0 20px rgba(79, 195, 247, 0.5), 0 0 30px rgba(79, 195, 247, 0.3)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '33%': { transform: 'translateY(-5px) translateX(5px)' },
          '66%': { transform: 'translateY(5px) translateX(-5px)' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563EB',
          navy: '#0F172A',
          bg: '#F8FAFC',
          secondary: '#64748B',
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
        }
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        tuitiontrack: {
          "primary": "#2563EB",
          "secondary": "#64748B",
          "accent": "#0284C7",
          "neutral": "#0F172A",
          "base-100": "#FFFFFF",
          "base-200": "#F8FAFC",
          "base-300": "#E2E8F0",
          "info": "#3B82F6",
          "success": "#16A34A",
          "warning": "#F59E0B",
          "error": "#DC2626",
        },
      },
      "light",
    ],
  },
};

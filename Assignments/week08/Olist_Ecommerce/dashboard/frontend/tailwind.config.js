/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        primary: "#4F46E5",     // Indigo
        primaryLight: "#EEF2FF", // Light Indigo for backgrounds
        secondary: "#059669",   // Green
        tertiary: "#EA580C",    // Orange
        background: "#F3F4F6",  // Slightly darker light-gray to make white cards pop
        surface: "#FFFFFF",
        success: "#059669",
        warning: "#EA580C",
        error: "#DC2626",
        info: "#4F46E5",
        textPrimary: "#1F2937", // Darker gray for better contrast
        textSecondary: "#6B7280", // Medium gray
        borderDefault: "#E5E7EB",
        borderHover: "#D1D5DB"
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)', // Very soft, large spread shadow
        'medium': '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px', // Extra rounded corners
      }
    },
  },
  plugins: [],
}

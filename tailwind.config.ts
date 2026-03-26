import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: "#edfdf6",
          100: "#d2f9e8",
          200: "#a9f1d5",
          300: "#6ee4bc",
          400: "#19C37D",
          500: "#0F7A5C",
          600: "#0a6349",
          700: "#084f3b",
          800: "#063e2f",
          900: "#042f23",
          950: "#021a14",
        },
        gold: {
          50: "#fefbeb",
          100: "#fdf3c7",
          200: "#fbe68a",
          300: "#F5D76E",
          400: "#f0c33d",
          500: "#D4AF37",
          600: "#b8912b",
          700: "#916a20",
          800: "#785420",
          900: "#654521",
          950: "#3a230a",
        },
        islamic: {
          green: "#0F7A5C",
          gold: "#D4AF37",
          teal: "#19C37D",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        glow: "0 0 15px rgba(25, 195, 125, 0.6)",
        "glow-gold": "0 0 20px rgba(212, 175, 55, 0.5)",
        "glow-sm": "0 0 10px rgba(25, 195, 125, 0.3)",
        premium: "0 4px 30px rgba(15, 122, 92, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.6s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "gradient-shift": "gradientShift 3s ease infinite",
        shimmer: "shimmer 2s infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(25, 195, 125, 0.7)" },
          "50%": { boxShadow: "0 0 0 12px rgba(25, 195, 125, 0)" },
        },
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand": "linear-gradient(135deg, #0F7A5C, #19C37D)",
        "gradient-premium": "linear-gradient(135deg, #0F7A5C, #19C37D, #D4AF37)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

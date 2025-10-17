const { fontFamily } = require("tailwindcss/defaultTheme")
const colors = require("tailwindcss/colors")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './styles/**/*.{ts,tsx,css}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        indigo: {
          ...colors.indigo,
          300: "#a2acc9",
          400: "#8c97b5",
          500: "#7581a0",
          600: "#606c8b",
          700: "#4c586f",
        },
        blue: {
          ...colors.blue,
          300: "#9fb6c9",
          400: "#89a3b6",
          500: "#748fa3",
          600: "#5d798d",
          700: "#4a6273",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        lavender: {
          50: 'hsl(var(--lavender-50))',
          100: 'hsl(var(--lavender-100))',
        },
        purple: {
          ...colors.purple,
          300: "#b0a8c4",
          400: "#9a92af",
          500: "#837c99",
          600: "#6b6482",
        },
        pink: {
          ...colors.pink,
          300: "#deb3c2",
          400: "#c89dad",
          500: "#b08697",
          600: "#966e7e",
        },
        cyan: {
          ...colors.cyan,
          300: "#a8d1d8",
          400: "#93bcc4",
          500: "#7aa6af",
          600: "#628f99",
        },
        teal: {
          ...colors.teal,
          300: "#9bc5c0",
          400: "#86b1ac",
          500: "#6f9b96",
          600: "#59847f",
        },
        emerald: {
          ...colors.emerald,
          300: "#a6cbb6",
          400: "#8bb59d",
          500: "#739f87",
          600: "#5d8971",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        "scale-x": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'fadeIn': 'fadeIn 0.5s ease-in',
        blob: "blob 7s infinite",
        float: "float 3s ease-in-out infinite",
        "gradient-x": "gradient-x 15s ease infinite",
        "scale-x": "scale-x 1s ease-out forwards",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      const newUtilities = {
        '.animation-delay-2000': {
          'animation-delay': '2s',
        },
        '.animation-delay-4000': {
          'animation-delay': '4s',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}

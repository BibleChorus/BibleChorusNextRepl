const { fontFamily } = require("tailwindcss/defaultTheme")

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
          50: "hsl(var(--lavender-50))",
          100: "hsl(var(--lavender-100))",
        },
        indigo: {
          50: "#f2f4ff",
          100: "#e5e9ff",
          200: "#cdd4fb",
          300: "#afb9f5",
          400: "#8f9fec",
          500: "#6f84e0",
          600: "#566cc8",
          700: "#4555a6",
          800: "#3a4784",
          900: "#333b69",
          950: "#232747",
        },
        blue: {
          50: "#edf5ff",
          100: "#dbeafd",
          200: "#bcd6f8",
          300: "#95bbed",
          400: "#6f9fe0",
          500: "#4c84ce",
          600: "#3a6bb3",
          700: "#325792",
          800: "#2d4874",
          900: "#25395a",
          950: "#16243a",
        },
        purple: {
          50: "#f6f1ff",
          100: "#e9ddfb",
          200: "#d6c1f5",
          300: "#be9fee",
          400: "#a180e0",
          500: "#8363c8",
          600: "#6b4fac",
          700: "#58418a",
          800: "#47356d",
          900: "#362853",
          950: "#231a36",
        },
        cyan: {
          50: "#eafbff",
          100: "#d1f3fb",
          200: "#a9e4f5",
          300: "#7cd0e9",
          400: "#56b9d9",
          500: "#3a9ec4",
          600: "#2f82a5",
          700: "#276986",
          800: "#22546a",
          900: "#1b3f4f",
          950: "#102834",
        },
        teal: {
          50: "#e9fbf7",
          100: "#cef3ea",
          200: "#a3e3d6",
          300: "#78ceb9",
          400: "#55b5a0",
          500: "#3b9a86",
          600: "#317f70",
          700: "#2a675a",
          800: "#234f45",
          900: "#1a3a33",
          950: "#0f2520",
        },
        emerald: {
          50: "#edfbf4",
          100: "#d3f3e1",
          200: "#aae4c5",
          300: "#7fcfa6",
          400: "#5bb68a",
          500: "#419b71",
          600: "#357f5d",
          700: "#2c674c",
          800: "#23503c",
          900: "#1a3a2c",
          950: "#0f251d",
        },
        pink: {
          500: "#EC4899", // Adjust this color as needed
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

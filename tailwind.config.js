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
          50: "#f4f5ff",
          100: "#e7ebff",
          200: "#ccd4f5",
          300: "#b0bde8",
          400: "#8e9ecf",
          500: "#6e7eb7",
          600: "#57669c",
          700: "#46527f",
          800: "#3a4465",
          900: "#2f3751",
          950: "#202437",
        },
        blue: {
          50: "#eff6ff",
          100: "#dce8f7",
          200: "#c2d3eb",
          300: "#a2bad9",
          400: "#7d9cc2",
          500: "#5c7fa9",
          600: "#49688d",
          700: "#3c5472",
          800: "#30435c",
          900: "#263447",
          950: "#1a2431",
        },
        purple: {
          50: "#f7f2ff",
          100: "#eadff8",
          200: "#d6c5eb",
          300: "#bda7d9",
          400: "#9d87c2",
          500: "#7c6ba9",
          600: "#65568d",
          700: "#51456f",
          800: "#41365a",
          900: "#312945",
          950: "#211b2e",
        },
        cyan: {
          50: "#eaf9fc",
          100: "#d3eef5",
          200: "#b2dce7",
          300: "#8dc4d4",
          400: "#6ba7bd",
          500: "#518ba4",
          600: "#416f85",
          700: "#35596b",
          800: "#2a4655",
          900: "#1f3440",
          950: "#14232b",
        },
        teal: {
          50: "#e9f8f5",
          100: "#cfece4",
          200: "#aad9cc",
          300: "#84c0b0",
          400: "#65a397",
          500: "#4b887d",
          600: "#3d6d65",
          700: "#325750",
          800: "#27433d",
          900: "#1c302c",
          950: "#121f1d",
        },
        emerald: {
          50: "#edf8f1",
          100: "#d4eddf",
          200: "#aedbc3",
          300: "#89c2a6",
          400: "#6da588",
          500: "#53896f",
          600: "#436e59",
          700: "#365747",
          800: "#2a4236",
          900: "#1d2f27",
          950: "#121f18",
        },
        pink: {
          50: "#fdf2f7",
          100: "#f9e1ed",
          200: "#f1c3d8",
          300: "#e5a1c0",
          400: "#d380a7",
          500: "#bf6a91",
          600: "#a6557a",
          700: "#874562",
          800: "#69374d",
          900: "#4d2536",
          950: "#331825",
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

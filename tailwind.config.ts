import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Zambian Flag Colors
        zambian: {
          green: {
            DEFAULT: '#198A00',
            light: '#22A800',
            dark: '#116600',
            50: '#E8F5E6',
            100: '#C8E6C4',
            200: '#A5D69F',
            300: '#82C67A',
            400: '#67B95E',
            500: '#198A00',
            600: '#157A00',
            700: '#116600',
            800: '#0D5200',
            900: '#083E00',
          },
          red: {
            DEFAULT: '#DE2010',
            light: '#F03020',
            dark: '#B81808',
            50: '#FEE9E7',
            100: '#FCC8C3',
            200: '#FAA49B',
            300: '#F88073',
            400: '#F66455',
            500: '#DE2010',
            600: '#C81D0E',
            700: '#B81808',
            800: '#A01406',
            900: '#880F04',
          },
          orange: {
            DEFAULT: '#EF7D00',
            light: '#FF9520',
            dark: '#D66F00',
            50: '#FFF3E6',
            100: '#FFE0BF',
            200: '#FFCC95',
            300: '#FFB86B',
            400: '#FFA84B',
            500: '#EF7D00',
            600: '#D66F00',
            700: '#BD6200',
            800: '#A45500',
            900: '#8B4800',
          },
          black: {
            DEFAULT: '#000000',
            light: '#1A1A1A',
            dark: '#000000',
          },
        },
        // Keep primary as Zambian green for compatibility
        primary: {
          50: '#E8F5E6',
          100: '#C8E6C4',
          200: '#A5D69F',
          300: '#82C67A',
          400: '#67B95E',
          500: '#198A00',
          600: '#157A00',
          700: '#116600',
          800: '#0D5200',
          900: '#083E00',
        },
        // Secondary as Zambian orange
        secondary: {
          50: '#FFF3E6',
          100: '#FFE0BF',
          200: '#FFCC95',
          300: '#FFB86B',
          400: '#FFA84B',
          500: '#EF7D00',
          600: '#D66F00',
          700: '#BD6200',
          800: '#A45500',
          900: '#8B4800',
        },
        // Accent as Zambian red
        accent: {
          50: '#FEE9E7',
          100: '#FCC8C3',
          200: '#FAA49B',
          300: '#F88073',
          400: '#F66455',
          500: '#DE2010',
          600: '#C81D0E',
          700: '#B81808',
          800: '#A01406',
          900: '#880F04',
        },
      },
    },
  },
  plugins: [],
}

export default config
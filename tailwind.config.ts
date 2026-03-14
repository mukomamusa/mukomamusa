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
        // Vayazed Brand Colors - Teal Color Scheme
        vayazed: {
          teal: {
            DEFAULT: '#2BB2A9',
            light: '#3DC9C0',
            dark: '#1A8A82',
            50: '#E6F7F6',
            100: '#CCEEEE',
            200: '#99E0DB',
            300: '#66D1C8',
            400: '#47C3B9',
            500: '#2BB2A9',
            600: '#259E96',
            700: '#1F8A83',
            800: '#197670',
            900: '#13625D',
          },
          // Secondary dark teal
          dark: {
            DEFAULT: '#1A8A82',
            light: '#22A8A0',
            dark: '#126C66',
            50: '#E6F5F4',
            100: '#CDEBEB',
            200: '#9BD7D7',
            300: '#69C3C3',
            400: '#47B5B5',
            500: '#1A8A82',
            600: '#157A74',
            700: '#106A66',
            800: '#0B5A58',
            900: '#064A4A',
          },
          // Accent green
          green: {
            DEFAULT: '#659E85',
            light: '#7DB49D',
            dark: '#4D886D',
            50: '#E8F3EC',
            100: '#D1E8DA',
            200: '#A3D8B5',
            300: '#75C790',
            400: '#57B77E',
            500: '#659E85',
            600: '#5A8E76',
            700: '#4F7E67',
            800: '#446E58',
            900: '#395E49',
          },
          // Neutral beige
          beige: {
            DEFAULT: '#B9B9A0',
            light: '#C9C9B5',
            dark: '#A9A98B',
            50: '#F7F7F2',
            100: '#EDEDE3',
            200: '#DBDBC6',
            300: '#C9C9A9',
            400: '#BDBD9D',
            500: '#B9B9A0',
            600: '#A7A790',
            700: '#959580',
            800: '#838370',
            900: '#717160',
          },
          // Dark background
          black: {
            DEFAULT: '#000103',
            light: '#1A1A1D',
            dark: '#000000',
          },
        },
        // Primary color - Vayazed Teal
        primary: {
          50: '#E6F7F6',
          100: '#CCEEEE',
          200: '#99E0DB',
          300: '#66D1C8',
          400: '#47C3B9',
          500: '#2BB2A9',
          600: '#259E96',
          700: '#1F8A83',
          800: '#197670',
          900: '#13625D',
        },
        // Secondary color - Dark Teal
        secondary: {
          50: '#E6F5F4',
          100: '#CDEBEB',
          200: '#9BD7D7',
          300: '#69C3C3',
          400: '#47B5B5',
          500: '#1A8A82',
          600: '#157A74',
          700: '#106A66',
          800: '#0B5A58',
          900: '#064A4A',
        },
        // Accent color - Green
        accent: {
          50: '#E8F3EC',
          100: '#D1E8DA',
          200: '#A3D8B5',
          300: '#75C790',
          400: '#57B77E',
          500: '#659E85',
          600: '#5A8E76',
          700: '#4F7E67',
          800: '#446E58',
          900: '#395E49',
        },
        // Success state
        success: {
          DEFAULT: '#2BB2A9',
          light: '#3DC9C0',
          dark: '#1A8A82',
        },
        // Warning state
        warning: {
          DEFAULT: '#FFD700',
          light: '#FFE033',
          dark: '#CCAC00',
        },
        // Error state
        error: {
          DEFAULT: '#DE2010',
          light: '#F03020',
          dark: '#B81808',
        },
      },
    },
  },
  plugins: [],
}

export default config
module.exports = {
  content: {
    mode: 'all',
    content: ['./**/*.html'],
    options: {
      whitelist: [],
    },
  },
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        body: ['"Futura Std"'],
        display: ['"Futura Std"'],
        sans: ['"Futura Std"'],
      },
      colors: {
        pine: {
          100: '#d2d7cf',
          200: '#a5af9f',
          300: '#79886f',
          400: '#4c603f',
          DEFAULT: '#1f380f',
          600: '#20390f',
          700: '#182b0b',
          800: '#101c08',
          900: '#080e04',
        },
        sage: {
          100: '#f4f3ed',
          200: '#e9e7dc',
          300: '#dddcca',
          400: '#d2d0b9',
          DEFAULT: '#c7c4a7',
          600: '#9f9d86',
          700: '#777664',
          800: '#504e43',
          900: '#282721',
        },
        grey: {
          DEFAULT: '#d8d7d5',
        },
        mustardgreen: {
          DEFAULT: '#73733D',
        },
      },
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function ({ addBase, theme }) {
      function extractColorVars(colorObj, colorGroup = '') {
        return Object.keys(colorObj).reduce((vars, colorKey) => {
          const value = colorObj[colorKey];
          const cssVariable =
            colorKey === 'DEFAULT' ? `--color${colorGroup}` : `--color${colorGroup}-${colorKey}`;

          const newVars =
            typeof value === 'string'
              ? { [cssVariable]: value }
              : extractColorVars(value, `-${colorKey}`);

          return { ...vars, ...newVars };
        }, {});
      }

      addBase({
        ':root': extractColorVars(theme('colors')),
      });
    },
  ],
};

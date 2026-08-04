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
      colors: {
        blue: {
          50: '#E9F5FB',
          100: '#D4EBF7',
          200: '#A8D8F0',
          300: '#7DC4E8',
          400: '#52B1E0',
          DEFAULT: '#269DD9', // hsl(200, 70, 50)
          600: '#1F7EAD',
          700: '#175E82',
          800: '#0F3F57',
          900: '#081F2B',
        },
        red: {
          50: '#fbebe9',
          100: '#f7d7d4',
          200: '#f0afa8',
          300: '#e8887d',
          400: '#e06052',
          DEFAULT: '#d93826', // hsl(6, 70, 50)
          600: '#ad2d1f',
          700: '#822217',
          800: '#57160f',
          900: '#2c0b07',
        },
      },
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

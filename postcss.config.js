module.exports = {
  plugins: [
    // Inline @import so the stylesheet is a single request. Without this the
    // browser has to fetch style.css, parse it, and only then discover
    // font-futura.css - a render-blocking round trip on every page load.
    require(`postcss-import`),
    require(`tailwindcss`)(`./tailwind.config.js`),
    require(`autoprefixer`),
    ...(process.env.NODE_ENV === 'production'
      ? [
          require(`cssnano`)({
            preset: 'default',
          }),
        ]
      : []),
  ],
};

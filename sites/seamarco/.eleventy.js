const yaml = require('js-yaml');
const { DateTime } = require('luxon');
const { EleventyHtmlBasePlugin } = require('@11ty/eleventy');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const htmlmin = require('html-minifier');

module.exports = function (eleventyConfig) {
  eleventyConfig.setBrowserSyncConfig({
    open: 'local',
    startPath: '/',
  });

  // Disable automatic use of your .gitignore
  eleventyConfig.setUseGitIgnore(false);

  // Merge data instead of overriding
  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addGlobalData('gitsha', require('../../scripts/gitsha'));

  // Mark preview builds so templates can emit a noindex robots tag
  eleventyConfig.addGlobalData('isPreview', () => !!process.env.PREVIEW);

  // Rewrite root-relative href/src/srcset to include PATH_PREFIX so the site
  // works when served from a subfolder (e.g. seamarco.nl/<branch>/).
  // Registered before the htmlmin transform so minification runs last.
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  const defaultLanguage = 'en';

  eleventyConfig.addFilter('byLanguage', (path, page) => {
    var localeOfCurrentPage = page.split('/').filter(String)[0];
    if (path[localeOfCurrentPage]) {
      return path[localeOfCurrentPage];
    } else {
      return path[defaultLanguage];
    }
  });

  eleventyConfig.addFilter('withoutLanguage', (currentPath) => {
    var localeOfCurrentPage = currentPath.split('/').filter(String)[0];
    return currentPath.replace('/' + localeOfCurrentPage + '/', '');
  });

  eleventyConfig.addFilter('isLanguage', (currentPath, language) => {
    var currentLanguage = currentPath.split('/').filter(String)[0];
    if (currentLanguage) {
      return currentLanguage === language;
    } else {
      return false;
    }
  });

  eleventyConfig.addShortcode('currentLanguage', (currentPath) => {
    var currentLanguage = currentPath.split('/').filter(String)[0];
    console.log('currentLanguage', currentLanguage);
    return true;
    console.log('currentLanguage', currentLanguage);
    if (currentLanguage) {
      return currentLanguage === language;
    } else {
      return false;
    }
  });

  eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

  eleventyConfig.addFilter('categoryPublicationCount', (category) =>
    category.subcategories.reduce((sum, subcategory) => sum + subcategory.items.length, 0)
  );

  // Syntax Highlighting for Code blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  // To Support .yaml Extension in _data
  // You may remove this if you can use JSON
  eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents));

  // Copy Image Folder to /_site
  eleventyConfig.addPassthroughCopy('./src/static/img');
  eleventyConfig.addPassthroughCopy('./src/static/js');

  // Copy favicon to route of /_site
  eleventyConfig.addPassthroughCopy('./src/favicon.ico');

  // Minify HTML
  eleventyConfig.addTransform('htmlmin', function (content, outputPath) {
    // Eleventy 1.0+: use this.inputPath and this.outputPath instead
    if (outputPath.endsWith('.html')) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }

    return content;
  });

  // Let Eleventy transform HTML files as nunjucks
  // So that we can use .html instead of .njk
  return {
    dir: {
      input: 'src',
    },
    htmlTemplateEngine: 'njk',
    pathPrefix: process.env.PATH_PREFIX || '/',
  };
};

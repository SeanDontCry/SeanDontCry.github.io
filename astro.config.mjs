// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://SeanDontCry.github.io',
  integrations: [mdx(), sitemap()],
  prefetch: true,
  // 舊網址導向新頁面
  redirects: {
    '/about': '/#about',
    '/projects': '/works/#project',
    '/lab': '/works/#lab',
  },
});

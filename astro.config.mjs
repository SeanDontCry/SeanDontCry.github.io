// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 部署前把 site 改成你的網域（sitemap 與分享連結會用到）
export default defineConfig({
  site: 'https://SeanDontCry.github.io',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  prefetch: true,
});

import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

export const TAGS = ['影像處理', '嵌入式', 'Web', '演算法', '機器學習'] as const;

const demo = z
  .object({
    kind: z.enum(['browser', 'video', 'backend']),
    // browser：src/components/demos/index.ts 裡註冊的元件名稱
    component: z.string().optional(),
    // video：YouTube 影片 ID（網址 v= 後面那段）
    youtubeId: z.string().optional(),
    // backend：線上 Demo 網址（Railway 等）
    url: z.url().optional(),
  })
  .optional();

const projects = defineCollection({
  loader: glob({ pattern: '*/index.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(80),
      cover: image(),
      coverAlt: z.string(),
      preview: z.string().optional(), // 卡片滑過時播放的短片（放在 public/ 下的路徑）
      tags: z.array(z.enum(TAGS)).min(1),
      stack: z.array(z.string()),
      role: z.string().optional(),
      date: z.coerce.date(),
      featured: z.boolean().default(false),
      status: z.enum(['完成', '進行中']).default('完成'),
      demo,
      repo: z.url().optional(),
      summaryEn: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

const lab = defineCollection({
  loader: glob({ pattern: '*.{md,mdx}', base: './src/content/lab' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(80),
      date: z.coerce.date(),
      component: z.string(),
      cover: image().optional(), // 選填：卡片封面，沒有時顯示佔位圖
      coverAlt: z.string().optional(),
      featured: z.boolean().default(true), // 是否出現在首頁輪播
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects, lab };

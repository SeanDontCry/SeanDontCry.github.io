// 把「專案」與「實驗」整理成同一種卡片資料，首頁輪播與作品頁共用。
import type { ImageMetadata } from 'astro';
import { getProjects, getLab } from './content';

export type WorkItem = {
  kind: 'project' | 'lab';
  href: string;
  title: string;
  summary: string;
  meta: string;
  cover?: ImageMetadata;
  coverAlt?: string;
  featured: boolean;
};

export async function getWorks(): Promise<WorkItem[]> {
  const projects = (await getProjects()).map<WorkItem>((p) => ({
    kind: 'project',
    href: `/projects/${p.id}/`,
    title: p.data.title,
    summary: p.data.summary,
    meta: `${p.data.date.getFullYear()} · ${p.data.stack.join('、')}`,
    cover: p.data.cover,
    coverAlt: p.data.coverAlt,
    featured: p.data.featured,
  }));
  const lab = (await getLab()).map<WorkItem>((l) => ({
    kind: 'lab',
    href: `/lab/${l.id}/`,
    title: l.data.title,
    summary: l.data.summary,
    meta: `${l.data.date.getFullYear()} · 實驗室`,
    cover: l.data.cover,
    coverAlt: l.data.coverAlt,
    featured: l.data.featured,
  }));
  return [...projects, ...lab];
}

// 互動 Demo 註冊表：新增 Demo 元件後在這裡登記名稱，
// 專案 frontmatter 的 demo.component 或實驗室的 component 就能引用。
import ImageFilterDemo from './ImageFilterDemo.astro';
import SortingVisualizer from './SortingVisualizer.astro';

export const demos = {
  'image-filter': ImageFilterDemo,
  'sorting': SortingVisualizer,
} as const;

export type DemoName = keyof typeof demos;

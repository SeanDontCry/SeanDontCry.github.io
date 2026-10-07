// ─────────────────────────────────────────────────────────────
// 個人資料與網站文案：全站的文字內容都集中在這裡。
// 專案與實驗的內容請改 src/content/ 下的 .mdx 檔。
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: '孫祥恩',
  nameEn: 'Sean Sun',

  // 左上角品牌字樣
  brand: { short: 'Sean', role: 'Freelance Developer' },

  // 聯絡方式（留空的項目不會顯示）
  email: 'r08548034@g.ntu.edu.tw',
  github: 'https://github.com/SeanDontCry',
  linkedin: 'https://www.linkedin.com/in/seansun-b04502020-r08548034',
  resume: '/resume.pdf',
  // Web3Forms access key（https://web3forms.com 免費申請）；留空則接案頁改顯示 Email
  web3formsKey: '',

  // 搜尋引擎與分享預覽使用的描述
  description: '全端軟體工程師，專注網頁與 LINE 應用開發，也具備影像處理與機械工程背景。',

  // 首頁主視覺
  hero: {
    eyebrow: 'IMAGE PROCESSING · WEBSITE · WEB APP',
    title: ['您好！我是Sean,', '一個接案開發者', '以及創意愉快犯！'],
    subtitle: ["Hi! I'm Sean.", 'Freelance Developer · Playful Disruptor'],
    lead: '全端軟體工程師，專注網頁與 LINE 應用開發，也具備影像處理與機械工程背景。',
    stamp: ['SEAN SUN', '2026'],
  },

  // 首頁「經歷與技能」
  skills: ['影像處理', '電腦視覺', 'AOI系統', '網頁應用', 'LINE LIFF', 'TypeScript', 'Canvas API'],
  timeline: [
    { period: '2026-NOW', title: '接案工程師', org: 'Freelance', note: '［WEB APP／LINEBOT］' },
    { period: '2022-2026', title: '演算法工程師', org: '由田新技股份有限公司', note: '［影像處理演算法／AOI軟體開發］' },
    { period: '2019-2021', title: '碩士', org: '國立臺灣大學', note: '［動作捕捉／人體動作分析］' },
    { period: '2015-2019', title: '學士', org: '國立臺灣大學', note: '機械工程學系' },
  ],

  // 頁尾的合作邀請
  contact: {
    title: '歡迎一起合作！',
    body: '正在尋找影像處理與電腦視覺、網頁與 LINE 應用相關的工作與專案合作。',
  },

  // 接案頁
  servicesPage: {
    title: '接案與合作',
    lead: '如果你有影像、裝置或網頁相關的技術問題，歡迎描述你的需求，我會盡快回覆。',
  },
  services: [
    {
      title: '影像處理與電腦視覺',
      body: '演算法設計、效能優化與部署，從原型驗證到可上線的實作。',
    },
    {
      title: '網頁與 LINE LIFF 應用',
      body: '前後端開發、資料庫串接與雲端部署。',
    },
  ],
  process: [
    { title: '需求訪談', body: '了解問題、限制與預期成果，評估是否適合。' },
    { title: '提案與報價', body: '說明做法、時程與交付項目。' },
    { title: '開發與定期回報', body: '依里程碑交付可運作的版本。' },
    { title: '交付與維護', body: '提供文件與原始碼，約定後續支援方式。' },
  ],
};

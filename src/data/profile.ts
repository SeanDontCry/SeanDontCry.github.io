// 個人資料集中管理：改這裡，全站同步更新。
// 標記 TODO 的欄位請在部署前填上。

export const profile = {
  name: '孫祥恩',
  nameEn: 'Sean Sun',
  tagline: '專注於影像處理與嵌入式系統的軟體工程師，從演算法到裝置端都能落地。',
  location: '台灣 Taiwan',
  affiliation: '國立臺灣大學  National Taiwan University',
  email: 'r08548034@g.ntu.edu.tw', 
  github: 'https://github.com/SeanDontCry', 
  linkedin: 'https://www.linkedin.com/in/seansun-b04502020-r08548034', 
  resume: '/resume.pdf', 
  // Web3Forms 的 access key（https://web3forms.com 免費申請），留空則聯絡表單改顯示信箱
  web3formsKey: '',

  skills: [
    { level: '專長', items: ['影像處理', '網頁設計', 'LINE bot'] },
    { level: '熟悉', items: ['C#','C++','Python','MATLAB'] as string[] }, 
    { level: '接觸過', items: [] as string[] },
  ],

  // TODO: 依時間由新到舊填寫；留空時「經歷」區塊不會顯示
  experience: [] as { period: string; title: string; org: string; summary?: string }[],

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
};

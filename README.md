# 個人作品集網站

Astro 靜態網站，部署在 Cloudflare Pages。網站本身不需要伺服器，所有互動 Demo 都在瀏覽器內執行。

## 環境需求

- Node.js 22.12 以上（`.nvmrc` 已指定 22）

## 本機開發

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 產生 dist/
npm run preview    # 預覽建置結果
npx astro check    # 型別檢查
```

## 部署前必改

1. `astro.config.mjs`：把 `site` 改成你的網域。
2. `src/data/profile.ts`：填寫標記 `TODO` 的欄位（Email、GitHub、技能、經歷）。
3. 履歷：把 PDF 放到 `public/resume.pdf`，再把 `profile.resume` 改成 `'/resume.pdf'`。
4. 聯絡表單：到 [Web3Forms](https://web3forms.com) 用信箱免費申請 access key，填入 `profile.web3formsKey`。留空時，接案頁會改顯示 Email。
5. 範例內容：`src/content/projects/browser-image-filters/` 與 `src/content/lab/sorting-visualizer.mdx` 是可運作的範例，可保留、改寫或刪除。

## 部署到 Cloudflare Pages

1. 在 GitHub 建立 repo，推上這個專案。
2. Cloudflare 後台 → Workers & Pages → 建立 → Pages → 連接 Git，選擇這個 repo。
3. 建置設定：
   - Framework preset：Astro
   - Build command：`npm run build`
   - Build output directory：`dist`
   - 環境變數：`NODE_VERSION` = `22`
4. 部署完成後會得到 `*.pages.dev` 網址。之後每次 push 到 `main` 都會自動重新部署，開 PR 則會產生預覽網址。
5. 自訂網域：專案頁面 → Custom domains → 加入網域。網域若也在 Cloudflare 註冊，DNS 會自動設定。
6. 流量分析：專案頁面的 Metrics 中啟用 Web Analytics，不需要改程式碼。

Cloudflare 後台的選單名稱偶爾會調整，若找不到對應項目，以「Pages」與「連接 Git」為關鍵字搜尋即可。

## 改用 GitHub Pages（`<username>.github.io` 免費網域）

1. 把 repo 命名為 `<username>.github.io`，網址就是 `https://<username>.github.io`。
   若用其他 repo 名稱，網址會變成 `https://<username>.github.io/<repo>/`，需要在 `astro.config.mjs` 加上 `base: '/<repo>'`，且站內連結都要改為帶前綴，因此建議直接用 `<username>.github.io`。
2. `astro.config.mjs` 的 `site` 改成 `https://<username>.github.io`。
3. repo 的 Settings → Pages → Source 選「GitHub Actions」。
4. push 到 `main`，`.github/workflows/deploy.yml` 會自動建置並部署。

與 Cloudflare Pages 的差異：沒有 PR 預覽網址、`public/_headers` 不會生效（不影響功能）、流量分析需另外加。之後要換自訂網域，在 Settings → Pages → Custom domain 設定即可。

## 新增一個專案

1. 複製 `docs/project-template.mdx` 到 `src/content/projects/<資料夾名稱>/index.mdx`，資料夾名稱就是網址。
2. 把封面圖放在同一個資料夾，填好 frontmatter。欄位寫錯時建置會直接報錯並指出哪一欄。
3. 要上首頁就設 `featured: true`；寫完把 `draft` 改成 `false`（`npm run dev` 時草稿也會顯示）。
4. 本機確認後 push，自動上線。

## 新增互動 Demo

1. 在 `src/components/demos/` 新增 `.astro` 元件，互動邏輯寫在元件內的 `<script>`。
   - 以 `document.addEventListener('astro:page-load', ...)` 初始化，換頁時才會重新綁定。
   - 共用的影像運算放在 `src/lib/`。
2. 在 `src/components/demos/index.ts` 註冊名稱。
3. 專案用 `demo: { kind: browser, component: <名稱> }` 引用；實驗室用 `component: <名稱>`。

需要伺服器的 Demo（例如 Python 推論服務）部署在 Railway，專案設 `demo.kind: backend` 並填 `url`；建議同時填 `youtubeId` 作為服務暫停時的備援影片。後端記得開放本網域的 CORS。

## 目錄

```
src/
├── components/         版型元件（Hero、ProjectRow、DemoSlot…）
│   └── demos/          互動 Demo 與註冊表
├── content/
│   ├── projects/       每個專案一個資料夾
│   └── lab/            每個實驗一個 .mdx
├── content.config.ts   內容欄位定義（schema）
├── data/profile.ts     個人資料
├── layouts/            頁面外框
├── lib/                影像運算、測試圖、內容查詢
├── pages/              路由
└── styles/global.css   色彩與字體 token、內文樣式
docs/project-template.mdx   新專案模板
```

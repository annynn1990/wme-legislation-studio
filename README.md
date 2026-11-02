# 黃名帝國立法研究室（WME Legislation Studio）

面向黃名帝國的法律資料庫與立法研究工作台：匯入法律全文、拆分條文、保存來源、檢索相關規定，再按立法目標產生有依據可追溯的法案草稿。

**本專案是立法研究及起草輔助工具，不是自動立法機關。** AI 建議不構成正式法律決定。系統不得把未檢索到的條文、虛構法源或模型自行生成的條號當成現行法律。

## 已實作功能

- 法律全文直接貼上或批次匯入 TXT、MD、可搜尋 PDF、DOCX、HTML。
- 常見中文「第○條」格式切分及章節標記。
- 法規版本效力標記：現行、歷史、草案、廢止、待確認。
- PostgreSQL 法規資料、版本、條文及分析紀錄。
- 管理密碼登入及 HttpOnly 簽章 Cookie。
- 依立法目標檢索已匯入的現行條文。
- AI 分析衝突、重複、漏洞、歧義、權限及程序問題。
- 產生建議章節、逐條草案、立法理由、法律效果及待決問題。
- 對模型回傳的來源 ID 做白名單核驗，並可複製完整草案。

## 技術架構

- Next.js 16 App Router、React 19、TypeScript
- PostgreSQL 17、pg_trgm、pgvector（向量欄位已預留）
- OpenAI-compatible Chat Completions API（可接 Vercel AI Gateway 或其他相容服務）
- PDF 文字抽取：pdf-parse；DOCX：Mammoth
- Docker Compose

## 本機啟動

需求：Docker Desktop、Node.js 20.9 或更新版本。

```bash
git clone https://github.com/annynn1990/wme-legislation-studio.git
cd wme-legislation-studio
cp .env.example .env
```

編輯 `.env`：

```env
ADMIN_PASSWORD=請換成長且隨機的密碼
AUTH_SECRET=至少32字元的隨機密鑰
AI_API_KEY=你的模型服務金鑰
AI_MODEL=模型供應商目前支援的模型ID
```

啟動：

```bash
docker compose up --build -d
```

瀏覽器開啟 http://localhost:3000，使用 `ADMIN_PASSWORD` 登入。

查看服務：

```bash
docker compose ps
docker compose logs -f web
```

## AI 設定

預設使用 OpenAI 相容 API。Vercel AI Gateway 可使用：

- `AI_BASE_URL=https://ai-gateway.vercel.sh/v1`
- `AI_API_KEY`（或 `AI_GATEWAY_API_KEY`）
- `AI_MODEL`：請填入帳戶當下可用的模型 ID

不設定 AI 金鑰時，法律匯入與查閱仍可使用，立法分析會提示設定 AI 服務。

## 法規匯入

每份文件建立一筆法規及一個版本。系統抽取文字、切分條文，並保留全文及來源檔名。支援 TXT、MD、PDF、DOCX、HTML；掃描圖片型 PDF 尚未支援 OCR。特殊條號格式請人工抽查。

不同版本應分別匯入並標註效力狀態。只有標記為「現行有效」的版本會預設進入 AI 分析；歷史版本不可誤當現行法。

## 「最佳法案」評估原則

不存在脫離政策選擇的唯一最佳法案。系統應同時評估：
1. 憲制及法規位階一致性
2. 權限與授權依據明確性
3. 跨法規內容一致性
4. 程序完整性及可執行性
5. 法律明確性與權利影響
6. 最小必要修法及制度轉換成本
7. 每條草案的來源可追溯性

## 重要限制

- 現階段使用關鍵字檢索，不代表全庫完整審計；未被檢索到的相關法條不會自動進入本次 AI 分析。
- pgvector 欄位已預留，但尚未接入 embedding 生成與語意檢索。
- 匯入 API 在請求內處理；大量或大型文件建議分批匯入。背景佇列、OCR、全庫逐條審計及多人審議列為後續版本。
- 系統不自動判定法律效力、法規位階或授權鏈。正式審議前須核對原始法律、版本、生效日期及相關上位法。
- 生產部署前應設置 HTTPS、強密碼、正式資料庫備份、上傳大小限制及存取監控。

## 開發指令

```bash
npm install
npm run typecheck
npm run build
npm run dev
```


## GitHub Pages 展示版（Repository-first）

本專案新增 site/ 靜態展示版，前端不需要 PostgreSQL、Render 或網站伺服器：

- 網站由 GitHub Pages 提供，前端原始碼位於 site/。
- 法律資料由 site/data/laws.json 載入；原始法律檔案及版本紀錄保存在 Git。
- site/app.js 提供法規清單、條文瀏覽、關鍵字檢索、前端輸入、Fine-grained Token 授權後直接提交 GitHub，以及 JSON 備份匯出。
- 靜態展示版不含管理密碼、不會把 AI 金鑰放進瀏覽器，也不會假裝已連接 AI。
- 原有 Next.js／PostgreSQL／AI API 程式碼暫時保留在 Repository，供日後安全接入真正的 AI 後端；它不是 GitHub Pages 的執行部分。

### 啟用 GitHub Pages

首次啟用需在 GitHub Repository 設定一次：

1. 開啟 Settings → Pages。
2. 在 Build and deployment → Source 選擇 GitHub Actions。
3. 儲存後，main 分支內 site/ 有更新時會自動部署。

部署網址：https://annynn1990.github.io/wme-legislation-studio/ 。

### 法律資料保存流程

網站「資料管理」頁可直接輸入法律全文。使用者需建立只授權 `annynn1990/wme-legislation-studio`、Contents Read and write 的 Fine-grained Token，在頁面輸入後按「儲存至 GitHub」；頁面會讀取遠端最新 laws.json，只追加尚未提交的新法規，再以 GitHub Contents API 建立 Commit。Token 僅保留在目前頁面記憶體，不寫入 localStorage、Cookie 或 Repository，提交成功後欄位清空。建議設定短效期，不要在聊天或公開位置分享 Token。

> 注意：目前範例《首都論壇帖務條例》沿用示例原文，效力狀態設為「待核實」。展示版的立法研究只執行條文關鍵字檢索，不會把命中結果宣稱為 AI 分析、法規衝突判定或全庫完整審計。


## 前端直接寫入 GitHub

GitHub Pages 本身是靜態託管，無法在伺服器端保管寫入憑證。展示版的「資料管理」頁因此採用 GitHub Fine-grained Personal Access Token，由 Repository 擁有者在前端手動輸入，直接透過 GitHub Contents API 更新 site/data/laws.json。

建議權限：只選取 annynn1990/wme-legislation-studio 一個 Repository；Repository permissions 的 Contents 設為 Read and write；Metadata 使用預設唯讀。Token 只在目前頁面記憶體中使用，不寫入 localStorage、Cookie、URL 或 Repository，成功提交後欄位會清空。重新整理頁面後需要重新輸入。請勿把 Token 貼到聊天、Issue 或任何公開位置。

儲存前會先讀取 GitHub 最新 laws.json，將本次頁面新增資料與遠端現有法規依 ID 合併，再更新檔案；若發生版本衝突，請重新整理頁面再提交。成功後 GitHub Pages workflow 自動部署更新。

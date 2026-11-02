# 黃名帝國立法研究室（WME Legislation Studio）

一套用來匯入大量法規、建立可追溯的條文資料庫、分析跨法規衝突與重複規範，並依立法目標提出整合法案草案的工作台。

> 本專案是立法研究及起草輔助工具，不是自動立法機關。AI 的每項法律判斷與草案均須由立法者核對；系統不得把未檢索到的條文、虛構的法源或模型自行生成的條號當成現行法律。

## 第一版功能

- 法律全文匯入：支援直接貼上 TXT／Markdown／可搜尋 PDF／DOCX／HTML 文字；亦支援多份 TXT、MD 文件批次匯入。
- 條文切分：辨識「第○條」及常見中文條號，保留原始全文、章節與條號。
- 法規及版本管理：保存制定／修正版本、生效狀態與來源，不覆寫歷史版本。
- 條文檢索：以 PostgreSQL 全文及相似詞檢索相關法條，提供來源追溯。
- 立法研究：分析衝突、重複、漏洞、歧義、權限不明及程序缺漏。
- 草案產生：產生立法架構、逐條條文、立法理由、法律效果、引用來源與待決政策問題。
- 完整草案複製：可複製不含比較標記的法案全文。

## 技術架構

- Next.js App Router + React + TypeScript
- PostgreSQL + pgvector + pg_trgm
- Node.js API routes
- OpenAI-compatible Chat Completions API（可接 Vercel AI Gateway 或其他相容服務）
- Docker Compose

## 快速啟動

需要 Docker Desktop 與 Node.js 20.9+。

1. 複製專案並建立環境檔：

```bash
git clone https://github.com/annynn1990/wme-legislation-studio.git
cd wme-legislation-studio
cp .env.example .env
```

2. 編輯 `.env`，設定管理密碼、簽章密鑰、資料庫與模型 API：

```env
ADMIN_PASSWORD=請換成長且隨機的密碼
AUTH_SECRET=請換成至少32字元的隨機密鑰
DATABASE_URL=postgres://postgres:postgres@db:5432/legislation
AI_BASE_URL=https://ai-gateway.vercel.sh/v1
AI_API_KEY=你的模型服務金鑰
AI_MODEL=請填入模型服務目前支援的模型ID
```

3. 啟動：

```bash
docker compose up --build -d
```

4. 開啟 http://localhost:3000 。

## 本機開發

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run db:migrate
npm run dev
```

## 法規資料原則

每部法律由「法規基本資料 → 法規版本 → 條文」組成。版本需標記為現行、歷史、草案、廢止或待確認。只有被明確標記為現行的版本才能預設進入現行法分析；未確認效力的資料不可當作現行法。

## 「最佳法案」的評估

不存在脫離政策選擇的唯一最佳法案。系統會依下列維度列出建議與取捨：

1. 憲制與法規位階一致性
2. 權限及授權依據明確性
3. 法規內容一致性
4. 程序完整性與可執行性
5. 法律明確性及權利影響
6. 最小必要修法與轉換成本
7. 每條草案的來源可追溯性

## 目前限制

- 第一版以單一管理者作為內部工作台；正式公開部署前必須完成登入、權限、HTTPS、備份與安全檢查。
- 條文切分依常見中文條號格式，表格、附表、圖片型 PDF 與特殊編號仍須人工抽查。
- AI 分析採檢索增強方式，不等於已完整審核全庫。每次分析均應確認相關法規已匯入且版本效力正確。
- 不提供法律效力的自動最終判定；歷史法規、憲法位階及授權關係均需立法者確認。

## 開發指令

```bash
npm run typecheck
npm run build
```

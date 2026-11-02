# 法律資料夾

正式法規資料由 laws.json 載入。

## 收錄規則

- 每份法律以一個物件表示，至少包含 id、title、jurisdiction、validityStatus、sourceFile、originalText 及 articles。
- validityStatus 限用 current、historical、draft、repealed、unknown。
- 未核對公布、生效及廢止紀錄前，請使用 unknown；不要把未知狀態標成現行有效。
- sourceFile 指向 Repository 內的原始法律文件，應一併保存。
- 每條條文保留 chapter、number、heading、content。
- 版本修訂時應保留舊版本，不要直接覆蓋歷史原文；建議以新版本紀錄及來源路徑表達。

## 加入新法

1. 將原文放入 site/data/originals/ 或 examples/。
2. 在 laws.json 新增法規物件，拆分條文並標記版本效力。
3. 檢查來源檔案、條號及原文是否一致。
4. 提交 Commit。GitHub Pages 工作流程會自動重新部署靜態網站。

網站內「資料管理」的匯入功能只在目前瀏覽器分頁暫存；下載後必須手動更新本檔並 Commit，才會永久保存於 Git。

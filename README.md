# 台股加權指數 × 全球資產 20 年連動回測儀表板

以 Yahoo Finance 日收盤資料，回測台股加權指數與費城半導體、台積電（2330／ADR）、美元/台幣、美元指數、歐元、美 10 年債殖利率、黃金、比特幣的相關性。支援任意區間、單一年度、日／週／月報酬，並標註重大事件與 ±20% 大行情波段。

## 架構

```
後端（GitHub Actions）                      前端（GitHub Pages，純靜態）
┌──────────────────────────┐              ┌──────────────────────────────┐
│ config/assets.json       │              │ docs/index.html  載入 JSON    │
│        ↓                 │   commit     │ docs/js/app.js   計算＋繪圖   │
│ backend/fetch_data.py    │ ───────────→ │ docs/css/style.css           │
│  · yfinance 抓日收盤      │  docs/data/  │ docs/data/events.json 事件    │
│  · 排序去重、剔除錯誤報價  │              │                              │
│  · 失敗時沿用舊資料       │              │ 相關係數、β、滾動相關、波段等 │
└──────────────────────────┘              │ 全部在瀏覽器即時計算          │
                                          └──────────────────────────────┘
```

| 路徑 | 用途 |
|---|---|
| `config/assets.json` | 商品清單（Yahoo 代號、名稱、顏色、是否美國時段、是否殖利率、說明）。**增刪商品只要改這裡** |
| `backend/fetch_data.py` | 後端腳本：抓資料 → 清理 → 輸出 `docs/data/prices.json`、`docs/data/meta.json` |
| `docs/data/events.json` | 年度總經主軸、事件日、事件期間卡片（手動維護，前端直接讀） |
| `docs/index.html` `docs/js/app.js` `docs/css/style.css` | 前端（桌面版） |
| `docs/m/` | 前端（手機版），與桌面版共用 `docs/data/` |
| `.github/workflows/update-data.yml` | 排程：台北 05:47（美股收盤後）與 15:17（台股收盤後），可手動或外部觸發 |
| `tools/cloudflare-worker.js` | 選用：用 Cloudflare Worker 準時觸發更新 |

## 部署步驟

1. 建立 GitHub repo，把整個資料夾推上去（分支 `main`）。
2. **Settings → Actions → General → Workflow permissions** 選 **Read and write permissions**。
3. **Actions → 更新行情資料 → Run workflow** 手動跑第一次，產生 `docs/data/prices.json` 與 `meta.json`。
4. **Settings → Pages**：Source 選 **Deploy from a branch**，Branch 選 `main`、資料夾 `/docs`。
5. 開啟 `https://<帳號>.github.io/<repo>/`。

> 第一次執行前 `docs/data/` 只有 `events.json`，網頁會顯示「資料載入失敗」，跑完第 3 步就正常。

## 更換或新增商品

編輯 `config/assets.json` 的 `assets` 陣列，例如加入日經 225：

```json
{"key": "N225", "ticker": "^N225", "name": "日經 225", "code": "N225", "us": 0, "focus": 0, "color": "#e879f9", "spike": 0.12, "desc": "日本股市指標。"}
```

| 欄位 | 說明 |
|---|---|
| `key` | 內部代號（英數，不可重複） |
| `ticker` | Yahoo Finance 代號 |
| `us` | 1＝在台股收盤後才收盤（美國時段），日報酬改用「前一晚 → 台股隔天」對齊 |
| `yld` | 1＝殖利率類，以變動點數計算，不算報酬率 |
| `focus` | 1＝出現在「單日最大漲跌」與「事件後表現」表格欄位 |
| `hint` | `invert`（提示反轉右軸）或 `norm`（提示基期=100） |
| `spike` | 剔除錯誤報價的單日跳動門檻（例：0.05＝5%） |

存檔推上去後手動 Run workflow 一次即可。前端完全依設定檔產生，不用改程式。

## 本機測試

```bash
pip install -r requirements.txt
python backend/fetch_data.py         # 產生 docs/data/*.json
cd docs && python -m http.server     # 開 http://localhost:8000
```

直接雙擊 `index.html` 會因瀏覽器安全限制讀不到 JSON，請用上面的本機伺服器或 GitHub Pages。

## 其他功能

- **手機版**：`https://<帳號>.github.io/<repo>/m/`，底部分頁（總覽／走勢／年度／事件／波段）、可滑動的期間選單、觸控圖表（按住左右滑動看數值與事件）、卡片式清單，不需左右捲動表格。桌面版在小螢幕開啟時會提示切換。
- 網頁右上「💾 下載離線單檔版」：把目前資料打包成單一 HTML，可離線開啟或寄給別人。
- 每個區塊都可匯出 CSV（含 UTF-8 BOM，Excel 直接開）、JSON、PNG。
- 標題列會顯示資料更新時間；若某商品抓取失敗，會標示「沿用舊資料」。

## 方法說明

- 股票類使用還原收盤價（`auto_adjust=True`）。
- 日報酬以台股交易日為基準；週／月報酬以日曆週／月最後收盤計算，受時差影響小，判讀匯率建議看週或月。
- 波段以收盤價 ±20% 反轉定義（zigzag）。
- 相關不代表因果；本專案僅供研究與教育用途，不構成投資建議。

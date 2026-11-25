"""
台股 × 全球資產連動儀表板 — 後端資料更新腳本
-------------------------------------------------
由 GitHub Actions 執行：
  1. 讀取 config/assets.json 的商品清單
  2. 從 Yahoo Finance 抓取日收盤（股票用還原收盤價）
  3. 清理：排序去重、剔除「單日暴衝又立刻回來」的錯誤報價
  4. 輸出 docs/data/prices.json（價格）與 docs/data/meta.json（商品設定 + 更新資訊）

任何單一商品抓取失敗時沿用上一版資料；基準（台股）失敗則整體中止、不覆寫。
"""
from __future__ import annotations

import json
import math
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

import pandas as pd
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config" / "assets.json"
OUT_DIR = ROOT / "docs" / "data"
PRICES = OUT_DIR / "prices.json"
META = OUT_DIR / "meta.json"
TW_TZ = timezone(timedelta(hours=8))

MIN_ROWS = 200          # 少於此筆數視為抓取失敗
RETRIES = 3


def log(msg: str) -> None:
    print(f"[{datetime.now(TW_TZ):%H:%M:%S}] {msg}", flush=True)


def download(ticker: str, start: str) -> pd.Series:
    """回傳 index=date(YYYY-MM-DD 交易所當地日期)、值=收盤價 的 Series。"""
    last_err = None
    for i in range(RETRIES):
        try:
            df = yf.Ticker(ticker).history(start=start, interval="1d", auto_adjust=True, actions=False)
            if df is None or df.empty or "Close" not in df:
                raise ValueError("empty dataframe")
            s = df["Close"].dropna()
            # yfinance 的 index 為交易所時區，取當地日期即為交易日
            s.index = pd.to_datetime([d.date() for d in s.index])
            s = s[~s.index.duplicated(keep="last")].sort_index()
            s = s[s > 0]
            if len(s) < MIN_ROWS:
                raise ValueError(f"only {len(s)} rows")
            return s
        except Exception as e:  # noqa: BLE001
            last_err = e
            log(f"  {ticker} 第 {i + 1} 次失敗：{e}")
            time.sleep(3 * (i + 1))
    raise RuntimeError(f"{ticker} 抓取失敗：{last_err}")


def remove_spikes(s: pd.Series, th: float) -> tuple[pd.Series, list[str]]:
    """剔除單日漲跌超過門檻、且隔天反向回來的孤立錯誤報價。"""
    vals = list(s.values)
    idx = list(s.index)
    removed: list[str] = []
    changed = True
    while changed:
        changed = False
        for i in range(1, len(vals) - 1):
            a = vals[i] / vals[i - 1] - 1
            b = vals[i + 1] / vals[i] - 1
            if abs(a) > th and abs(b) > th * 0.6 and math.copysign(1, a) != math.copysign(1, b):
                removed.append(f"{idx[i]:%Y-%m-%d}:{vals[i]:.6g}")
                del vals[i]
                del idx[i]
                changed = True
                break
    return pd.Series(vals, index=idx), removed


def to_compact(s: pd.Series, yld: bool) -> dict:
    digits = 5 if yld else 7
    return {
        "d": [int(d.strftime("%Y%m%d")) for d in s.index],
        "c": [float(f"{v:.{digits}g}") for v in s.values],
    }


def main() -> int:
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    start = cfg.get("start", "2005-01-01")
    base = cfg["base"]
    assets = cfg["assets"]

    old = json.loads(PRICES.read_text(encoding="utf-8")) if PRICES.exists() else {}
    prices: dict = {}
    report: dict = {}

    for item in [base] + assets:
        key, ticker = item["key"], item["ticker"]
        log(f"抓取 {key} ({ticker})")
        try:
            s = download(ticker, start)
            s, removed = remove_spikes(s, float(item.get("spike", 0.2)))
            prices[key] = to_compact(s, bool(item.get("yld")))
            report[key] = {
                "ticker": ticker, "status": "ok", "rows": len(s),
                "first": f"{s.index[0]:%Y-%m-%d}", "last": f"{s.index[-1]:%Y-%m-%d}",
                "last_close": float(s.iloc[-1]), "removed": removed,
            }
            log(f"  OK {len(s)} 筆 {s.index[0]:%Y-%m-%d} ~ {s.index[-1]:%Y-%m-%d}，剔除 {len(removed)} 筆")
        except Exception as e:  # noqa: BLE001
            if key == base["key"]:
                log(f"基準 {key} 失敗，中止且不覆寫資料：{e}")
                return 1
            if key in old:
                prices[key] = old[key]
                report[key] = {"ticker": ticker, "status": "stale", "error": str(e),
                               "last": str(old[key]["d"][-1])}
                log(f"  沿用舊資料：{e}")
            else:
                report[key] = {"ticker": ticker, "status": "missing", "error": str(e)}
                log(f"  無舊資料可沿用，此商品略過：{e}")

    now = datetime.now(TW_TZ)
    meta = {
        "generated": now.strftime("%Y-%m-%d %H:%M"),
        "generated_iso": now.isoformat(timespec="seconds"),
        "source": "Yahoo Finance (yfinance, auto_adjust=True)",
        "base": base,
        "assets": [a for a in assets if a["key"] in prices],
        "report": report,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    PRICES.write_text(json.dumps(prices, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    META.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    log(f"完成：prices.json {PRICES.stat().st_size / 1024:.0f} KB，meta.json 已更新")
    bad = [k for k, v in report.items() if v["status"] != "ok"]
    if bad:
        log(f"注意：以下商品未更新 {bad}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

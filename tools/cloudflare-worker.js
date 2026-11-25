// 選用：用 Cloudflare Worker 的 Cron Trigger 觸發更新（比 GitHub 內建排程準時）
// 1. 在 Worker 設定環境變數 GH_TOKEN（Fine-grained PAT，只給本 repo 的 Contents: Read and write 權限）
// 2. 設定 REPO = "MaxTrader0207/<repo 名稱>"
// 3. Cron Triggers 例：「47 21 * * 1-5」「17 7 * * 1-5」（UTC）
// 若改用 Worker 觸發，可把 .github/workflows/update-data.yml 裡的 schedule 區塊刪掉，避免重複執行。
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(trigger(env));
  },
  async fetch(request, env) {
    // 手動測試：開啟 Worker 網址 /run?key=<RUN_KEY>
    const url = new URL(request.url);
    if (url.pathname === '/run' && env.RUN_KEY && url.searchParams.get('key') === env.RUN_KEY) {
      const r = await trigger(env);
      return new Response(`GitHub 回應 ${r.status}`, { status: r.ok ? 200 : 500 });
    }
    return new Response('ok');
  },
};

async function trigger(env) {
  return fetch(`https://api.github.com/repos/${env.REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'taiex-cross-asset-worker',
    },
    body: JSON.stringify({ event_type: 'update-data' }),
  });
}

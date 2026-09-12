// ============================================
// 📄 檔案名稱：worker.js
// 用途：Cloudflare Worker 代理伺服器，隱藏 OpenRouter API 金鑰
// ============================================

export default {
  async fetch(request, env) {
    // 處理瀏覽器的預檢請求 (CORS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
    }

    try {
      const { context } = await request.json();

      const prompt = `你是一位專業的旅行打包顧問。請根據以下旅程資訊，生成一份精簡實用的打包清單（15項以內）。
目的地：${context.destination}
出發月份：${context.month}
天數：${context.duration}天
行程活動類型：${context.activities}
預估天氣：${context.weather}

請只回傳條列式清單項目，每行一項，不要標題、不要多餘說明、不要編號，例如：
輕便雨傘
防曬乳 SPF50
舒適走路鞋`;

      /* 【需用戶設定】以下 env.OPENROUTER_API_KEY 會從 Cloudflare 後台的環境變數自動讀取，
         請勿在此處直接寫入金鑰明文，改用下方部署步驟第 4 點設定 */
      const apiKey = env.OPENROUTER_API_KEY;

      const orRes = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            /* 【需用戶設定】HTTP-Referer 建議填入你的網站網址，OpenRouter 用於統計來源，非必填但建議設定 */
            'HTTP-Referer': 'https://yourdomain.com',
            'X-Title': '旅行打包助手'
          },
          body: JSON.stringify({
            /* 【需用戶設定】model 可依需求更換，例如便宜款可用 "google/gemini-2.0-flash-001"
               或 "openai/gpt-4o-mini"，完整列表請查 https://openrouter.ai/models */
            model: 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'user', content: prompt }
            ]
          })
        }
      );

      const data = await orRes.json();
      const text = data?.choices?.[0]?.message?.content || '';

      if (!text) {
        return new Response(JSON.stringify({ error: 'AI 未回傳內容', raw: data }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      }

      return new Response(JSON.stringify({ result: text }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // 【需用戶設定】正式上線建議改為你的網站網址，例如 "https://yourdomain.com"
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

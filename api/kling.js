export default async function handler(req, res) {
  // 允許跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
  const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

  // 建立 JWT
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: KLING_ACCESS_KEY, exp: now + 1800, nbf: now - 5 })).toString('base64url');

  const crypto = await import('crypto');
  const sig = crypto.createHmac('sha256', KLING_SECRET_KEY)
    .update(`${header}.${payload}`)
    .digest('base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const { action, taskId, prompt } = req.body || req.query;

  try {
    if (action === 'create') {
      // 送出生成請求
      const r = await fetch('https://api.klingai.com/v1/videos/text2video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          model: 'kling-v1',
          prompt,
          negative_prompt: 'text, watermark, blurry, low quality',
          cfg_scale: 0.5,
          mode: 'std',
          duration: '5',
          aspect_ratio: '9:16'
        })
      });
      const data = await r.json();
      return res.json(data);

    } else if (action === 'check') {
      // 查詢進度
      const r = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const data = await r.json();
      return res.json(data);
    }

    return res.status(400).json({ error: 'invalid action' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

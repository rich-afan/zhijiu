import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
  const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;

  if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
    return res.status(500).json({ error: 'Missing Kling API keys in environment variables' });
  }

  // 產生 JWT
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    { iss: KLING_ACCESS_KEY, exp: now + 1800, nbf: now - 5 },
    KLING_SECRET_KEY,
    { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } }
  );

  const { action, taskId, prompt } = req.body || {};

  try {
    if (action === 'create') {
      if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

      const response = await fetch('https://api.klingai.com/v1/videos/text2video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Kling API error', detail: data });
      }
      return res.status(200).json(data);

    } else if (action === 'check') {
      if (!taskId) return res.status(400).json({ error: 'Missing taskId' });

      const response = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Kling API error', detail: data });
      }
      return res.status(200).json(data);

    } else {
      return res.status(400).json({ error: 'Invalid action. Use "create" or "check"' });
    }

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

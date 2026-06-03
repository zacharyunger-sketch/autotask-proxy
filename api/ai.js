// AI assistant via Anthropic API
// Requires env var: ANTHROPIC_API_KEY
const { cors } = require('./_autotask');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { prompt, context, mode = 'general' } = req.body;

    const systemPrompts = {
      triage: 'You are a service desk triage assistant for Neuro Building Systems, a building management tech company. Analyze tickets and suggest priority, assignment, and resolution steps. Be concise and actionable.',
      resolution: 'You are a technical support expert for Neuro Building Systems. Suggest specific resolution steps for IT/BMS/PRTG/VPN issues. Reference common fixes and KB articles where relevant. Be brief and technical.',
      customer_brief: 'You are summarizing a customer account for Neuro Building Systems support staff. Summarize open issues, history, and recommended actions in 3-5 bullet points.',
      general: 'You are a helpful service desk assistant for Neuro Building Systems. Answer questions about tickets, suggest actions, and help manage the support queue.',
    };

    const res2 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompts[mode] || systemPrompts.general,
        messages: [{ role: 'user', content: context ? `Context:\n${context}\n\nQuestion: ${prompt}` : prompt }],
      }),
    });

    const data = await res2.json();
    if (data.error) throw new Error(data.error.message);
    res.json({ response: data.content?.[0]?.text || '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

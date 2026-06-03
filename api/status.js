const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { ticketId, status } = req.body;
    await atFetch('/Tickets', {
      method: 'PATCH',
      body: JSON.stringify({ id: parseInt(ticketId), status: parseInt(status) }),
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

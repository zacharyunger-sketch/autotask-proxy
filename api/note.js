const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { ticketId, description, noteType = 3, publish = 1, title = 'Note' } = req.body;
    const body = `[Zach Unger] ${description}`;
    const data = await atFetch(`/Tickets/${ticketId}/Notes`, {
      method: 'POST',
      body: JSON.stringify({ ticketID: parseInt(ticketId), description: body, noteType, publish, title }),
    });
    res.json({ success: true, noteId: data.itemId });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

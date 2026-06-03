const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    const data = await atFetch(`/Tickets/${id}/Notes/query`, {
      method: 'POST',
      body: JSON.stringify({ MaxRecords: 50, filter: [] }),
    });
    res.json({ notes: data.items || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

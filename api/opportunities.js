const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const data = await atFetch('/Opportunities/query', {
      method: 'POST',
      body: JSON.stringify({ MaxRecords: 50, filter: [{ field: 'status', op: 'eq', value: 1 }] }),
    });
    res.json({ opportunities: data.items || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

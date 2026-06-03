const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const data = await atFetch('/Projects/query', {
      method: 'POST',
      body: JSON.stringify({ MaxRecords: 50, filter: [{ field: 'status', op: 'noteq', value: 5 }] }),
    });
    res.json({ projects: data.items || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

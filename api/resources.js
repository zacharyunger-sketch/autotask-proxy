const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const data = await atFetch('/Resources/query', {
      method: 'POST',
      body: JSON.stringify({ MaxRecords: 50, filter: [{ field: 'isActive', op: 'eq', value: true }] }),
    });
    const resources = (data.items || []).map(r => ({
      id: r.id, firstName: r.firstName, lastName: r.lastName,
      email: r.email, userName: r.userName,
    }));
    res.json({ resources });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

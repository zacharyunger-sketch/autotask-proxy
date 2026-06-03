const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { company } = req.query;
    const filters = [{ field: 'status', op: 'eq', value: 1 }];
    if (company) filters.push({ field: 'contractName', op: 'contains', value: company });
    const data = await atFetch('/Contracts/query', { method: 'POST', body: JSON.stringify({ MaxRecords: 50, filter: filters }) });
    res.json({ contracts: data.items || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

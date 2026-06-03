const { atFetch, formatTicket, cors } = require('./_autotask');

const OPEN_STATUSES = [1, 6, 7, 8, 9, 10, 11, 15, 16, 17];

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { company, limit = 50 } = req.query;
    const filters = OPEN_STATUSES.map(s => ({ field: 'status', op: 'noteq', value: s }));
    if (company) filters.push({ field: 'companyName', op: 'contains', value: company });
    const data = await atFetch('/Tickets/query', {
      method: 'POST',
      body: JSON.stringify({ MaxRecords: parseInt(limit), filter: filters }),
    });
    const tickets = (data.items || []).map(formatTicket);
    res.json({ tickets, total: tickets.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

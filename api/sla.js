const { atFetch, cors } = require('./_autotask');
const OPEN_STATUSES = [1, 6, 7, 8, 9, 10, 11, 15, 16, 17];
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const filters = OPEN_STATUSES.map(s => ({ field: 'status', op: 'noteq', value: s }));
    const data = await atFetch('/Tickets/query', { method: 'POST', body: JSON.stringify({ MaxRecords: 200, filter: filters }) });
    const tickets = data.items || [];
    const now = new Date();
    let onTime = 0, breached = 0, noSla = 0;
    tickets.forEach(t => {
      if (!t.dueDateTime) { noSla++; return; }
      if (new Date(t.dueDateTime) >= now) onTime++; else breached++;
    });
    const total = onTime + breached;
    res.json({ total: tickets.length, onTime, breached, noSla, attainment: total > 0 ? Math.round((onTime / total) * 100) : 100 });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

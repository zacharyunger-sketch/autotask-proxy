const { atFetch, formatTicket, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { id, ticketNumber } = req.query;
    let filter = [];
    if (ticketNumber) filter = [{ field: 'ticketNumber', op: 'eq', value: ticketNumber }];
    else if (id) filter = [{ field: 'id', op: 'eq', value: parseInt(id) }];
    else return res.status(400).json({ error: 'id or ticketNumber required' });
    const data = await atFetch('/Tickets/query', { method: 'POST', body: JSON.stringify({ MaxRecords: 1, filter }) });
    const t = (data.items || [])[0];
    if (!t) return res.json({ ticket: null });
    res.json({ ticket: formatTicket(t) });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

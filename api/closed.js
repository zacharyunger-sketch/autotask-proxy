const { atFetch, formatTicket, cors } = require('./_autotask');
const OPEN_STATUSES = [1, 6, 7, 8, 9, 10, 11, 15, 16, 17];
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { fromDate, toDate, keyword, company, limit = 50 } = req.query;
    const filters = [];
    OPEN_STATUSES.forEach(s => filters.push({ field: 'status', op: 'noteq', value: s }));
    if (fromDate) filters.push({ field: 'lastActivityDate', op: 'gte', value: new Date(fromDate).toISOString() });
    if (toDate) filters.push({ field: 'lastActivityDate', op: 'lte', value: new Date(toDate + 'T23:59:59').toISOString() });
    if (company) filters.push({ field: 'companyName', op: 'contains', value: company });
    const data = await atFetch('/Tickets/query', {
      method: 'POST',
      body: JSON.stringify({ MaxRecords: parseInt(limit), filter: filters }),
    });
    let tickets = (data.items || []).map(formatTicket);
    if (keyword) {
      const kw = keyword.toLowerCase();
      tickets = tickets.filter(t => t.title.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw) || t.ticketNumber.toLowerCase().includes(kw));
    }
    res.json({ tickets, total: tickets.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

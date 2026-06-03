const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { title, description, priority = 2, queueID = 29682833, companyID = 176, dueDate } = req.body;
    const payload = {
      title, description, priority, queueID, companyID, status: 1,
      dueDateTime: dueDate || new Date(Date.now() + 86400000).toISOString(),
    };
    const data = await atFetch('/Tickets', { method: 'POST', body: JSON.stringify(payload) });
    res.json({ success: true, ticketId: data.itemId });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

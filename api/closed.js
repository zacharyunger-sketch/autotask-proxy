const BASE_URL = `https://webservices${process.env.AT_INSTANCE || '22'}.autotask.net/ATServicesRest/V1.0`;
const STATUS_MAP = {1:'New',5:'Complete',6:'Waiting Customer',7:'Waiting Materials',8:'In Progress',9:'Scheduled',10:'Escalate',11:'Problem',13:'Denied',14:'Resolved',15:'Customer Contacted',16:'Pending',17:'Waiting Parts'};
const PRIORITY_MAP = {1:'Critical',2:'High',3:'Medium',4:'Low'};
const RESOURCE_MAP = {29682885:'David Unger',29682886:'Joseph Khoury',29682891:'Tom Munro',29682895:'Jarred Rey',29682896:'Alex Inglis',29682901:'Zach Unger',29683496:'Mustafa Moghul'};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { fromDate, toDate, keyword, company, limit = 50 } = req.query;
    // Only closed statuses
    const filter = [
      { field: 'status', op: 'eq', value: 5 },
    ];
    if (fromDate) filter.push({ field: 'lastActivityDate', op: 'gte', value: new Date(fromDate).toISOString() });
    if (toDate) filter.push({ field: 'lastActivityDate', op: 'lte', value: new Date(toDate + 'T23:59:59').toISOString() });
    if (company) filter.push({ field: 'companyName', op: 'contains', value: company });

    const atRes = await fetch(`${BASE_URL}/Tickets/query`, {
      method: 'POST',
      headers: { 'ApiIntegrationCode': process.env.AT_INTEGRATION_CODE, 'UserName': process.env.AT_USERNAME, 'Secret': process.env.AT_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaxRecords: parseInt(limit), filter }),
    });
    const data = await atRes.json();
    let tickets = (data.items || []).map(t => ({
      id: t.id, ticketNumber: t.ticketNumber, title: t.title,
      status: STATUS_MAP[t.status] || String(t.status), statusId: t.status,
      priority: PRIORITY_MAP[t.priority] || String(t.priority), priorityId: t.priority,
      companyName: t.companyName || '', assignedResource: t.assignedResourceID ? (RESOURCE_MAP[t.assignedResourceID] || '') : '',
      assignedResourceID: t.assignedResourceID || null, queueName: t.queueName || '',
      createDate: t.createDate, dueDateTime: t.dueDateTime, lastActivityDate: t.lastActivityDate, description: t.description || '',
    }));
    if (keyword) { const kw = keyword.toLowerCase(); tickets = tickets.filter(t => t.title.toLowerCase().includes(kw) || t.ticketNumber.toLowerCase().includes(kw)); }
    res.json({ tickets, total: tickets.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

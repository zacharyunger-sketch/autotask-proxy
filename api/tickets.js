const BASE_URL = `https://webservices${process.env.AT_INSTANCE || '22'}.autotask.net/ATServicesRest/V1.0`;

const STATUS_MAP = {1:'New',5:'Complete',6:'Waiting Customer',7:'Waiting Materials',8:'In Progress',9:'Scheduled',10:'Escalate',11:'Problem',13:'Denied',14:'Resolved',15:'Customer Contacted',16:'Pending',17:'Waiting Parts'};
const PRIORITY_MAP = {1:'Critical',2:'High',3:'Medium',4:'Low'};
const RESOURCE_MAP = {29682885:'David Unger',29682886:'Joseph Khoury',29682891:'Tom Munro',29682895:'Jarred Rey',29682896:'Alex Inglis',29682901:'Zach Unger',29683496:'Mustafa Moghul'};
const CLOSED_STATUSES = [5, 13, 14];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { company, limit = 50 } = req.query;

    // Filter: status IN open statuses (exclude closed)
    // Use eq filters with OR - get tickets matching any open status
    // Autotask supports 'in' operator for arrays
    const filter = [
      { field: 'status', op: 'noteq', value: 5 },   // not Complete
      { field: 'status', op: 'noteq', value: 13 },  // not Denied
      { field: 'status', op: 'noteq', value: 14 },  // not Resolved
    ];
    if (company) filter.push({ field: 'companyName', op: 'contains', value: company });

    const atRes = await fetch(`${BASE_URL}/Tickets/query`, {
      method: 'POST',
      headers: {
        'ApiIntegrationCode': process.env.AT_INTEGRATION_CODE,
        'UserName': process.env.AT_USERNAME,
        'Secret': process.env.AT_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ MaxRecords: parseInt(limit), filter }),
    });

    if (!atRes.ok) {
      const text = await atRes.text();
      return res.status(500).json({ error: `Autotask error ${atRes.status}: ${text}` });
    }

    const data = await atRes.json();
    const tickets = (data.items || []).map(t => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      status: STATUS_MAP[t.status] || String(t.status),
      statusId: t.status,
      priority: PRIORITY_MAP[t.priority] || String(t.priority),
      priorityId: t.priority,
      companyName: t.companyName || '',
      companyID: t.companyID || 0,
      assignedResource: t.assignedResourceID ? (RESOURCE_MAP[t.assignedResourceID] || '') : '',
      assignedResourceID: t.assignedResourceID || null,
      queueID: t.queueID,
      queueName: t.queueName || '',
      createDate: t.createDate,
      dueDateTime: t.dueDateTime,
      lastActivityDate: t.lastActivityDate,
      description: t.description || '',
    }));

    res.json({ tickets, total: tickets.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

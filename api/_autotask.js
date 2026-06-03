// Shared Autotask API helper
const BASE_URL = `https://webservices${process.env.AT_INSTANCE || '22'}.autotask.net/ATServicesRest/V1.0`;

function headers() {
  return {
    'ApiIntegrationCode': process.env.AT_INTEGRATION_CODE,
    'UserName': process.env.AT_USERNAME,
    'Secret': process.env.AT_SECRET,
    'Content-Type': 'application/json',
  };
}

async function atFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Autotask API error ${res.status}: ${text}`);
  }
  return res.json();
}

const STATUS_MAP = {
  1: 'New', 5: 'Complete', 6: 'Waiting Customer', 7: 'Waiting Materials',
  8: 'In Progress', 9: 'Scheduled', 10: 'Escalate', 11: 'Problem',
  13: 'Denied', 14: 'Resolved', 15: 'Customer Contacted', 16: 'Pending',
  17: 'Waiting Parts',
};
const PRIORITY_MAP = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };
const RESOURCE_MAP = {
  29682885: 'David Unger', 29682886: 'Joseph Khoury', 29682891: 'Tom Munro',
  29682895: 'Jarred Rey', 29682896: 'Alex Inglis', 29682901: 'Zach Unger',
  29683496: 'Mustafa Moghul',
};

function formatTicket(t) {
  return {
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
  };
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { atFetch, formatTicket, STATUS_MAP, PRIORITY_MAP, RESOURCE_MAP, cors };

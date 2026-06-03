/**
 * Autotask MCP Server - Vercel Serverless Function
 * Exposes Autotask ticket data as MCP tools callable from Claude Desktop / Cowork artifacts
 * Endpoint: /api/mcp (handles MCP JSON-RPC protocol)
 */

const BASE_URL = `https://webservices${process.env.AT_INSTANCE || '22'}.autotask.net/ATServicesRest/V1.0`;
const CLOSED_STATUSES = [5, 13, 14];

const AT_STATUS = {
  1: 'New', 5: 'Complete', 6: 'Waiting Customer', 7: 'Waiting Materials',
  8: 'In Progress', 9: 'Escalate', 10: 'Waiting Vendor', 11: 'Assigned',
  13: 'Denied', 14: 'Resolved', 15: 'Waiting Internal', 16: 'In Customer Review',
  17: 'Waiting Parts'
};

const AT_PRIORITY = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' };

function autotaskHeaders() {
  return {
    'Content-Type': 'application/json',
    'UserName': process.env.AT_USERNAME,
    'Secret': process.env.AT_SECRET,
    'ApiIntegrationCode': process.env.AT_INTEGRATION_CODE,
  };
}

async function queryTickets(filter) {
  const res = await fetch(`${BASE_URL}/Tickets/query`, {
    method: 'POST',
    headers: autotaskHeaders(),
    body: JSON.stringify({ filter }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Autotask API error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function shapeTicket(t) {
  return {
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    status: AT_STATUS[t.status] || String(t.status),
    statusCode: t.status,
    priority: AT_PRIORITY[t.priority] || String(t.priority),
    priorityCode: t.priority,
    companyName: t.companyName || '',
    assignedResource: t.assignedResourceFullName || t.assignedResource || '',
    createDate: t.createDate,
    dueDateTime: t.dueDateTime,
    description: (t.description || '').slice(0, 500),
  };
}

// ── MCP Tool Definitions ─────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'get_open_tickets',
    description: 'Get all open Autotask tickets, optionally filtered by building address or company name.',
    inputSchema: {
      type: 'object',
      properties: {
        building: { type: 'string', description: 'Filter by building address in ticket title (e.g. "830 Amsterdam Ave")' },
        company: { type: 'string', description: 'Filter by company name' },
      },
    },
  },
  {
    name: 'get_ticket',
    description: 'Get a single Autotask ticket by ticket number.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketNumber: { type: 'string', description: 'Ticket number e.g. T20260523.0001' },
      },
      required: ['ticketNumber'],
    },
  },
  {
    name: 'get_tickets_by_status',
    description: 'Get Autotask tickets filtered by status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['new', 'in_progress', 'waiting_customer', 'all_open', 'all'],
          description: 'Ticket status filter',
        },
      },
      required: ['status'],
    },
  },
];

// ── Tool Handlers ─────────────────────────────────────────────────────────────
async function handleGetOpenTickets({ building, company } = {}) {
  const filter = CLOSED_STATUSES.map(s => ({ op: 'noteq', field: 'status', value: s }));
  if (building) filter.push({ op: 'contains', field: 'title', value: building });
  if (company) filter.push({ op: 'contains', field: 'companyName', value: company });
  const data = await queryTickets(filter);
  const tickets = (data.items || []).map(shapeTicket);
  return { tickets, total: tickets.length };
}

async function handleGetTicket({ ticketNumber }) {
  const data = await queryTickets([{ op: 'eq', field: 'ticketNumber', value: ticketNumber }]);
  const tickets = (data.items || []).map(shapeTicket);
  return tickets[0] || null;
}

async function handleGetTicketsByStatus({ status }) {
  let filter = [];
  if (status === 'new') filter = [{ op: 'eq', field: 'status', value: 1 }];
  else if (status === 'in_progress') filter = [{ op: 'eq', field: 'status', value: 8 }];
  else if (status === 'waiting_customer') filter = [{ op: 'eq', field: 'status', value: 6 }];
  else if (status === 'all_open') filter = CLOSED_STATUSES.map(s => ({ op: 'noteq', field: 'status', value: s }));
  else filter = [{ op: 'gt', field: 'id', value: 0 }]; // all
  const data = await queryTickets(filter);
  const tickets = (data.items || []).map(shapeTicket);
  return { tickets, total: tickets.length };
}

// ── MCP JSON-RPC Handler ──────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // SSE transport for GET (MCP server-sent events)
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).write('data: {"jsonrpc":"2.0","method":"ping"}\n\n');
    return;
  }

  if (req.method !== 'POST') { res.status(405).end(); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { res.status(400).json({ error: 'Invalid JSON' }); return; } }

  const { jsonrpc, id, method, params } = body || {};

  function reply(result) { res.status(200).json({ jsonrpc: '2.0', id, result }); }
  function replyError(code, message) { res.status(200).json({ jsonrpc: '2.0', id, error: { code, message } }); }

  try {
    if (method === 'initialize') {
      return reply({
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'autotask', version: '1.0.0' },
        capabilities: { tools: {} },
      });
    }

    if (method === 'tools/list') {
      return reply({ tools: TOOLS });
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      let result;
      if (name === 'get_open_tickets') result = await handleGetOpenTickets(args);
      else if (name === 'get_ticket') result = await handleGetTicket(args);
      else if (name === 'get_tickets_by_status') result = await handleGetTicketsByStatus(args);
      else return replyError(-32601, `Unknown tool: ${name}`);
      return reply({ content: [{ type: 'text', text: JSON.stringify(result) }] });
    }

    if (method === 'ping') return reply({});

    return replyError(-32601, `Method not found: ${method}`);
  } catch (err) {
    console.error('MCP error:', err);
    return replyError(-32603, err.message);
  }
};

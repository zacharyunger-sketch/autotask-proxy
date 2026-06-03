const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { ticketId, resourceId } = req.body;
    // Get role for resource
    const roleData = await atFetch('/ResourceRoles/query', {
      method: 'POST',
      body: JSON.stringify({ MaxRecords: 1, filter: [{ field: 'resourceID', op: 'eq', value: parseInt(resourceId) }, { field: 'isActive', op: 'eq', value: true }] }),
    });
    const roleId = (roleData.items || [])[0]?.roleID || 29683465;
    await atFetch('/Tickets', {
      method: 'PATCH',
      body: JSON.stringify({ id: parseInt(ticketId), assignedResourceID: parseInt(resourceId), assignedResourceRoleID: roleId, status: 8 }),
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

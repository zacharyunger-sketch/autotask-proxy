// Send email via Microsoft Graph API
// Requires env vars: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, EMAIL_FROM
const { cors } = require('./_autotask');

async function getGraphToken() {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.AZURE_CLIENT_ID,
    client_secret: process.env.AZURE_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
  });
  const res = await fetch(`https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Graph token error: ' + JSON.stringify(data));
  return data.access_token;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { to, cc, subject, body, bodyType = 'Text' } = req.body;
    const recipients = (Array.isArray(to) ? to : [to]).map(email => ({ emailAddress: { address: email } }));
    const ccRecipients = cc ? (Array.isArray(cc) ? cc : [cc]).map(email => ({ emailAddress: { address: email } })) : [];

    const token = await getGraphToken();
    const from = process.env.EMAIL_FROM || 'zunger@neurobuildingsystems.com';

    const msgRes = await fetch(`https://graph.microsoft.com/v1.0/users/${from}/sendMail`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: bodyType, content: body },
          toRecipients: recipients,
          ccRecipients,
        },
        saveToSentItems: true,
      }),
    });

    if (!msgRes.ok) {
      const err = await msgRes.text();
      throw new Error(`Graph sendMail error ${msgRes.status}: ${err}`);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

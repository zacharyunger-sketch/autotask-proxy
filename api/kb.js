const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { keyword } = req.query;
    if (keyword) {
      const data = await atFetch('/KnowledgeBaseCategories/9/KnowledgeBaseArticles/query', {
        method: 'POST',
        body: JSON.stringify({ MaxRecords: 20, filter: [{ field: 'title', op: 'contains', value: keyword }] }),
      });
      return res.json({ articles: data.items || [] });
    }
    const data = await atFetch('/KnowledgeBaseCategories/query', {
      method: 'POST',
      body: JSON.stringify({ MaxRecords: 50, filter: [] }),
    });
    res.json({ categories: data.items || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

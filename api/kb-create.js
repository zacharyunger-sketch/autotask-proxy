const { atFetch, cors } = require('./_autotask');
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { title, articleBody, categoryId = 9 } = req.body;
    const data = await atFetch(`/KnowledgeBaseCategories/${categoryId}/KnowledgeBaseArticles`, {
      method: 'POST',
      body: JSON.stringify({ title, articleBody, categoryId, isPublished: true }),
    });
    res.json({ success: true, articleId: data.itemId });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

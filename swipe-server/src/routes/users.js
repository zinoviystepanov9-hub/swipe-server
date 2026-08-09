const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/users/me
router.get('/me', async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ user: user.toPublicJSON() });
});

// GET /api/users/search?q=текст
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (q.length < 1) return res.json({ users: [] });

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const users = await User.find({
    _id: { $ne: req.userId },
    $or: [{ login: regex }, { phone: regex }]
  }).limit(20);

  res.json({ users: users.map((u) => u.toPublicJSON()) });
});

module.exports = router;

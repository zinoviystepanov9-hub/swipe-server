const express = require('express');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/contacts — список контактов текущего пользователя вместе с данными собеседников
router.get('/', async (req, res) => {
  const contacts = await Contact.find({ ownerUserId: req.userId }).populate('contactUserId');
  const result = contacts
    .filter((c) => c.contactUserId) // на случай если собеседник удалён
    .map((c) => ({
      contactId: c._id.toString(),
      user: c.contactUserId.toPublicJSON()
    }));
  res.json({ contacts: result });
});

// POST /api/contacts { contactUserId } — добавляет контакт, если его ещё нет (getOrCreate)
router.post('/', async (req, res) => {
  const { contactUserId } = req.body;
  if (!contactUserId) return res.status(400).json({ error: 'contactUserId обязателен' });
  if (contactUserId === req.userId) return res.status(400).json({ error: 'Нельзя добавить себя' });

  const targetUser = await User.findById(contactUserId);
  if (!targetUser) return res.status(404).json({ error: 'Пользователь не найден' });

  const contact = await Contact.findOneAndUpdate(
    { ownerUserId: req.userId, contactUserId },
    { ownerUserId: req.userId, contactUserId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ contactId: contact._id.toString(), user: targetUser.toPublicJSON() });
});

module.exports = router;

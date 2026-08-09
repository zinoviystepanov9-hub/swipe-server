const express = require('express');
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/messages/:contactUserId — история переписки между мной и contactUserId
router.get('/:contactUserId', async (req, res) => {
  const { contactUserId } = req.params;
  const messages = await Message.find({
    $or: [
      { senderId: req.userId, receiverId: contactUserId },
      { senderId: contactUserId, receiverId: req.userId }
    ]
  }).sort({ createdAt: 1 });

  res.json({ messages: messages.map((m) => m.toPublicJSON()) });
});

module.exports = router;

const express = require('express');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Message = require('../models/Message');
const authMiddleware = require('../authMiddleware');

const router = express.Router();

function toPublicUser(user) {
    return {
        id: user._id.toString(),
        login: user.login,
        phone: user.phone || null,
        email: user.email || null,
        avatarRes: user.avatarRes,
    };
}

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
        res.json(toPublicUser(user));
    } catch (err) {
        console.error('me error:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// DELETE /api/users/me — удаляет аккаунт безвозвратно вместе с контактами и перепиской
router.delete('/me', authMiddleware, async (req, res) => {
    try {
        await Promise.all([
            User.findByIdAndDelete(req.userId),
            Contact.deleteMany({ $or: [{ ownerUserId: req.userId }, { contactUserId: req.userId }] }),
            Message.deleteMany({ $or: [{ fromUserId: req.userId }, { toUserId: req.userId }] }),
        ]);
        res.json({ ok: true });
    } catch (err) {
        console.error('delete account error:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// GET /api/users/search?q=текст
router.get('/search', authMiddleware, async (req, res) => {
    const q = (req.query.q || '').toString().trim();
    if (q.length === 0) return res.json([]);

    try {
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const users = await User.find({
            _id: { $ne: req.userId },
            $or: [{ login: regex }, { phone: regex }],
        }).sort({ login: 1 }).limit(30);

        res.json(users.map(toPublicUser));
    } catch (err) {
        console.error('search error:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;

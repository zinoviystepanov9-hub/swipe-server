const express = require('express');
const Contact = require('../models/Contact');
const User = require('../models/User');
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

// GET /api/contacts — список контактов текущего пользователя с данными о собеседнике
router.get('/', authMiddleware, async (req, res) => {
    try {
        const contacts = await Contact.find({ ownerUserId: req.userId }).populate('contactUserId');
        const result = contacts
            .filter(c => c.contactUserId)
            .map(c => ({
                contactId: c._id.toString(),
                user: toPublicUser(c.contactUserId),
            }))
            .sort((a, b) => a.user.login.localeCompare(b.user.login));
        res.json(result);
    } catch (err) {
        console.error('contacts list error:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// POST /api/contacts { contactUserId } — создать контакт (симметрично для обеих сторон)
router.post('/', authMiddleware, async (req, res) => {
    const { contactUserId } = req.body;
    if (!contactUserId || contactUserId === req.userId) {
        return res.status(400).json({ error: 'Некорректный contactUserId' });
    }

    try {
        const targetExists = await User.exists({ _id: contactUserId });
        if (!targetExists) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Создаём связь в обе стороны, чтобы оба видели друг друга в контактах
        await Contact.updateOne(
            { ownerUserId: req.userId, contactUserId },
            { $setOnInsert: { ownerUserId: req.userId, contactUserId } },
            { upsert: true }
        );
        await Contact.updateOne(
            { ownerUserId: contactUserId, contactUserId: req.userId },
            { $setOnInsert: { ownerUserId: contactUserId, contactUserId: req.userId } },
            { upsert: true }
        );

        res.status(201).json({ ok: true });
    } catch (err) {
        console.error('contacts create error:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;

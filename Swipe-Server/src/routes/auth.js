const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function signToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '90d' });
}

function toPublicUser(user) {
    return {
        id: user._id.toString(),
        login: user.login,
        phone: user.phone || null,
        email: user.email || null,
        avatarRes: user.avatarRes,
    };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { login, password, phone, email, avatarRes } = req.body;

    if (!login || !password) {
        return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }
    if (!phone && !email) {
        return res.status(400).json({ error: 'Укажите телефон или email' });
    }

    try {
        const orConditions = [{ login }];
        if (phone) orConditions.push({ phone });
        if (email) orConditions.push({ email });

        const existing = await User.findOne({ $or: orConditions });
        if (existing) {
            return res.status(409).json({ error: 'Логин, телефон или email уже заняты' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const avatar = Number.isInteger(avatarRes) ? avatarRes : Math.floor(Math.random() * 6) + 1;

        const user = await User.create({
            login,
            passwordHash,
            phone: phone || undefined,
            email: email || undefined,
            avatarRes: avatar,
        });

        const token = signToken(user._id.toString());
        res.status(201).json({ token, user: toPublicUser(user) });
    } catch (err) {
        console.error('register error:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { loginOrPhone, password } = req.body;
    if (!loginOrPhone || !password) {
        return res.status(400).json({ error: 'Введите логин/телефон и пароль' });
    }

    try {
        const user = await User.findOne({ $or: [{ login: loginOrPhone }, { phone: loginOrPhone }] });
        if (!user) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        const token = signToken(user._id.toString());
        res.json({ token, user: toPublicUser(user) });
    } catch (err) {
        console.error('login error:', err);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;

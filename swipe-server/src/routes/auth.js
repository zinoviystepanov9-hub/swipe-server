const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function issueToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '90d' });
}

router.post('/register', async (req, res) => {
  try {
    const { login, password, phone, email, avatarRes } = req.body;

    if (!login || !password || typeof avatarRes !== 'number') {
      return res.status(400).json({ error: 'login, password и avatarRes обязательны' });
    }
    if (!phone && !email) {
      return res.status(400).json({ error: 'Укажите телефон или email' });
    }

    const existing = await User.findOne({ login });
    if (existing) {
      return res.status(409).json({ error: 'Такой логин уже занят' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      login,
      passwordHash,
      phone: phone || null,
      email: email || null,
      avatarRes
    });

    const token = issueToken(user._id.toString());
    res.status(201).json({ token, user: user.toPublicJSON() });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Не удалось зарегистрироваться' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { loginOrPhone, password } = req.body;
    if (!loginOrPhone || !password) {
      return res.status(400).json({ error: 'loginOrPhone и password обязательны' });
    }

    const user = await User.findOne({
      $or: [{ login: loginOrPhone }, { phone: loginOrPhone }]
    });
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = issueToken(user._id.toString());
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Не удалось войти' });
  }
});

module.exports = router;

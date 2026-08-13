const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const ReadState = require('../models/ReadState');
const authMiddleware = require('../authMiddleware');

module.exports = function (io, onlineUsers) {
    const router = express.Router();

    function toPublicMessage(m) {
        return {
            id: m._id.toString(),
            fromUserId: m.fromUserId.toString(),
            toUserId: m.toUserId.toString(),
            text: m.text,
            createdAt: m.createdAt,
        };
    }

    function toPublicUser(u) {
        return {
            id: u._id.toString(),
            login: u.login,
            phone: u.phone || null,
            email: u.email || null,
            avatarRes: u.avatarRes,
            verified: !!u.verified,
        };
    }

    // GET /api/messages — список бесед (собеседник + последнее сообщение + число непрочитанных)
    router.get('/', authMiddleware, async (req, res) => {
        try {
            const myId = new mongoose.Types.ObjectId(req.userId);

            const grouped = await Message.aggregate([
                { $match: { $or: [{ fromUserId: myId }, { toUserId: myId }] } },
                { $sort: { createdAt: -1 } },
                {
                    $addFields: {
                        otherUserId: {
                            $cond: [{ $eq: ['$fromUserId', myId] }, '$toUserId', '$fromUserId'],
                        },
                    },
                },
                {
                    $group: {
                        _id: '$otherUserId',
                        lastMessage: { $first: '$$ROOT' },
                    },
                },
                { $sort: { 'lastMessage.createdAt': -1 } },
            ]);

            const otherIds = grouped.map((g) => g._id);
            const [users, readStates] = await Promise.all([
                User.find({ _id: { $in: otherIds } }),
                ReadState.find({ userId: myId, contactUserId: { $in: otherIds } }),
            ]);
            const userById = new Map(users.map((u) => [u._id.toString(), u]));
            const readAtById = new Map(readStates.map((r) => [r.contactUserId.toString(), r.lastReadAt]));

            const result = await Promise.all(
                grouped
                    .filter((g) => userById.has(g._id.toString()))
                    .map(async (g) => {
                        const otherIdStr = g._id.toString();
                        const lastReadAt = readAtById.get(otherIdStr) || new Date(0);
                        const unreadCount = await Message.countDocuments({
                            fromUserId: g._id,
                            toUserId: myId,
                            createdAt: { $gt: lastReadAt },
                        });
                        return {
                            user: toPublicUser(userById.get(otherIdStr)),
                            lastMessage: toPublicMessage(g.lastMessage),
                            unreadCount,
                        };
                    })
            );

            res.json(result);
        } catch (err) {
            console.error('conversations error:', err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });

    // GET /api/messages/:contactUserId — история переписки с конкретным пользователем
    router.get('/:contactUserId', authMiddleware, async (req, res) => {
        const otherId = req.params.contactUserId;

        try {
            const messages = await Message.find({
                $or: [
                    { fromUserId: req.userId, toUserId: otherId },
                    { fromUserId: otherId, toUserId: req.userId },
                ],
            }).sort({ createdAt: 1 }).limit(500);

            res.json(messages.map(toPublicMessage));
        } catch (err) {
            console.error('messages history error:', err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });

    // POST /api/messages/:contactUserId/read — отметить переписку прочитанной до текущего момента
    router.post('/:contactUserId/read', authMiddleware, async (req, res) => {
        const otherId = req.params.contactUserId;
        try {
            await ReadState.updateOne(
                { userId: req.userId, contactUserId: otherId },
                { $set: { lastReadAt: new Date() } },
                { upsert: true }
            );
            res.json({ ok: true });
        } catch (err) {
            console.error('mark read error:', err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });

    // POST /api/messages { toUserId, text } — отправить сообщение, доставить мгновенно если получатель онлайн
    router.post('/', authMiddleware, async (req, res) => {
        const { toUserId, text } = req.body;
        if (!toUserId || !text || !text.trim()) {
            return res.status(400).json({ error: 'toUserId и text обязательны' });
        }

        try {
            const created = await Message.create({
                fromUserId: req.userId,
                toUserId,
                text: text.trim(),
            });
            const message = toPublicMessage(created);

            // Мгновенная доставка через сокет, если получатель сейчас онлайн
            const recipientSocketId = onlineUsers.get(toUserId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('message:new', message);
            }

            res.status(201).json(message);
        } catch (err) {
            console.error('messages send error:', err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });

    return router;
};

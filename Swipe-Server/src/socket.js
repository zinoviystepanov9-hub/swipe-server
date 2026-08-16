const jwt = require('jsonwebtoken');

// onlineUsers: userId (number) -> socket.id (string)
const onlineUsers = new Map();

function setupSocket(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Нет токена'));
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = payload.userId;
            next();
        } catch (err) {
            next(new Error('Недействительный токен'));
        }
    });

    io.on('connection', (socket) => {
        onlineUsers.set(socket.userId, socket.id);
        console.log(`Пользователь ${socket.userId} онлайн (socket ${socket.id})`);

        // --- Заготовка сигналинга для будущих аудио/видео звонков (WebRTC) ---
        // Клиент будет отправлять offer/answer/ice-candidate конкретному собеседнику,
        // сервер просто пересылает их получателю, если тот сейчас в сети.
        socket.on('call:offer', ({ toUserId, offer }) => {
            const targetSocketId = onlineUsers.get(toUserId);
            if (targetSocketId) {
                io.to(targetSocketId).emit('call:offer', { fromUserId: socket.userId, offer });
            }
        });

        socket.on('call:answer', ({ toUserId, answer }) => {
            const targetSocketId = onlineUsers.get(toUserId);
            if (targetSocketId) {
                io.to(targetSocketId).emit('call:answer', { fromUserId: socket.userId, answer });
            }
        });

        socket.on('call:ice-candidate', ({ toUserId, candidate }) => {
            const targetSocketId = onlineUsers.get(toUserId);
            if (targetSocketId) {
                io.to(targetSocketId).emit('call:ice-candidate', { fromUserId: socket.userId, candidate });
            }
        });

        socket.on('call:end', ({ toUserId }) => {
            const targetSocketId = onlineUsers.get(toUserId);
            if (targetSocketId) {
                io.to(targetSocketId).emit('call:end', { fromUserId: socket.userId });
            }
        });
        // --- конец заготовки под звонки ---

        socket.on('disconnect', () => {
            if (onlineUsers.get(socket.userId) === socket.id) {
                onlineUsers.delete(socket.userId);
            }
            console.log(`Пользователь ${socket.userId} офлайн`);
        });
    });
}

module.exports = { setupSocket, onlineUsers };

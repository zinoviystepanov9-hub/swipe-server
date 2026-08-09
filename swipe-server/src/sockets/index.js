const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

// userId (string) -> socket.id, чтобы находить, кому доставлять события в реальном времени.
const onlineUsers = new Map();

function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('no_token'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.userId;
    next();
  } catch (err) {
    next(new Error('invalid_token'));
  }
}

function registerSocketHandlers(io) {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);
    console.log(`[socket] ${userId} подключился`);

    // ---------- Сообщения ----------
    // Клиент отправляет: socket.emit('message:send', { toUserId, text }, callback)
    socket.on('message:send', async ({ toUserId, text }, ack) => {
      try {
        if (!toUserId || !text || !text.trim()) {
          return ack?.({ error: 'toUserId и text обязательны' });
        }

        const message = await Message.create({
          senderId: userId,
          receiverId: toUserId,
          text: text.trim()
        });

        const payload = message.toPublicJSON();

        // Подтверждение отправителю (чтобы UI показал сообщение как отправленное)
        ack?.({ message: payload });

        // Доставка получателю, если он сейчас онлайн
        const recipientSocketId = onlineUsers.get(toUserId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:new', payload);
          message.delivered = true;
          await message.save();
        }
      } catch (err) {
        console.error('[socket message:send]', err);
        ack?.({ error: 'Не удалось отправить сообщение' });
      }
    });

    // ---------- Сигналинг звонков (заготовка под будущий WebRTC) ----------
    // Здесь сервер только передаёт события между двумя устройствами,
    // сам обмен аудио/видео потоками (WebRTC) в приложении пока не реализован.
    const relayToUser = (event) => (data) => {
      const targetSocketId = onlineUsers.get(data.toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit(event, { ...data, fromUserId: userId });
      }
    };

    socket.on('call:invite', relayToUser('call:invite'));       // { toUserId, callType }
    socket.on('call:accept', relayToUser('call:accept'));       // { toUserId }
    socket.on('call:reject', relayToUser('call:reject'));       // { toUserId }
    socket.on('call:end', relayToUser('call:end'));             // { toUserId }
    socket.on('call:offer', relayToUser('call:offer'));         // { toUserId, sdp }
    socket.on('call:answer', relayToUser('call:answer'));       // { toUserId, sdp }
    socket.on('call:ice-candidate', relayToUser('call:ice-candidate')); // { toUserId, candidate }

    socket.on('disconnect', () => {
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
      }
      console.log(`[socket] ${userId} отключился`);
    });
  });
}

module.exports = { registerSocketHandlers, onlineUsers };

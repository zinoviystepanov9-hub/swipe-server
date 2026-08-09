require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDb } = require('./src/db');
const { registerSocketHandlers } = require('./src/sockets');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const contactRoutes = require('./src/routes/contacts');
const messageRoutes = require('./src/routes/messages');

async function start() {
  await connectDb();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'swipe-server' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/contacts', contactRoutes);
  app.use('/api/messages', messageRoutes);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });
  registerSocketHandlers(io);

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`[server] Свайп-сервер запущен на порту ${port}`);
  });
}

start().catch((err) => {
  console.error('[server] Не удалось запустить сервер:', err);
  process.exit(1);
});

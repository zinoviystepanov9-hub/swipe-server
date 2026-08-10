require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDb = require('./db/connect');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const contactsRoutes = require('./routes/contacts');
const messagesRoutesFactory = require('./routes/messages');
const { setupSocket, onlineUsers } = require('./socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'swipe-server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/messages', messagesRoutesFactory(io, onlineUsers));

setupSocket(io);

const PORT = process.env.PORT || 3000;

connectDb()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Swipe-сервер запущен на порту ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Не удалось подключиться к базе данных:', err);
        process.exit(1);
    });

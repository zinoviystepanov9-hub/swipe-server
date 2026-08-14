const mongoose = require('mongoose');

async function connectDb() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('Переменная окружения MONGODB_URI не задана');
    }
    await mongoose.connect(uri);
    console.log('Подключение к MongoDB установлено');
}

module.exports = connectDb;

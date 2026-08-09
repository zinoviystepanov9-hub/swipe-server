const mongoose = require('mongoose');

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI не задан. Проверьте .env (локально) или Environment на Render (в проде).');
  }
  await mongoose.connect(uri);
  console.log('[db] Подключено к MongoDB');
}

module.exports = { connectDb };

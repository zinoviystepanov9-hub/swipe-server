const mongoose = require('mongoose');

// Хранит, до какого момента пользователь прочитал переписку с конкретным собеседником.
// Используется для подсчёта непрочитанных сообщений в списке чатов.
const readStateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contactUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastReadAt: { type: Date, required: true, default: () => new Date(0) },
}, { timestamps: false });

readStateSchema.index({ userId: 1, contactUserId: 1 }, { unique: true });

module.exports = mongoose.model('ReadState', readStateSchema);

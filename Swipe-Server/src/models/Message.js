const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
}, { timestamps: true });

messageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

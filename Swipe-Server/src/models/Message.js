const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
}, { _id: false });

const messageSchema = new mongoose.Schema({
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    reactions: { type: [reactionSchema], default: [] },
}, { timestamps: true });

messageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

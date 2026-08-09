const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true },
    delivered: { type: Boolean, default: false },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Быстрая выборка переписки между двумя людьми, отсортированная по времени.
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

messageSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    senderId: this.senderId.toString(),
    receiverId: this.receiverId.toString(),
    text: this.text,
    delivered: this.delivered,
    read: this.read,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Message', messageSchema);

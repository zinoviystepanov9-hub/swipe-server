const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    login: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    avatarRes: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

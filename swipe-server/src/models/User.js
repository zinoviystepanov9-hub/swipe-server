const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    login: { type: String, required: true, unique: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: null, trim: true, index: true },
    email: { type: String, default: null, trim: true, lowercase: true },
    avatarRes: { type: Number, required: true, min: 1, max: 6 }
  },
  { timestamps: true }
);

// Публичное представление пользователя — без хэша пароля.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    login: this.login,
    phone: this.phone,
    email: this.email,
    avatarRes: this.avatarRes,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);

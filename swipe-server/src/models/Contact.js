const mongoose = require('mongoose');

// Связь "владелец -> контакт", зеркалит структуру Contact из Android Room:
// ownerUserId видит contactUserId в своём списке контактов.
const contactSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contactUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

contactSchema.index({ ownerUserId: 1, contactUserId: 1 }, { unique: true });

module.exports = mongoose.model('Contact', contactSchema);

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    gradient: { type: String, required: true },
    isTrending: { type: Boolean, default: false },
    memberCount: { type: Number, default: 0 },
    recentPostCount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);

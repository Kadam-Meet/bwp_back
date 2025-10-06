const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    alias: { type: String, default: null },
    anonymousId: { type: String, unique: true, sparse: true },
    totalPosts: { type: Number, default: 0 },
    totalReactions: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);



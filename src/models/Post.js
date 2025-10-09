const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    category: { type: String, required: true },
    duration: { type: String, default: 'permanent' },
    isVoiceNote: { type: Boolean, default: false },
    isExpired: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);



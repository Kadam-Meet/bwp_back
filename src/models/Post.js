const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    category: { type: String, required: true },
    // Force all posts to be ephemeral for 24h
    duration: { type: String, default: '24h' },
    isVoiceNote: { type: Boolean, default: false },
    isExpired: { type: Boolean, default: false },
    // Default expiration 24 hours after creation
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
  },
  { timestamps: true }
);

// TTL index: documents are automatically deleted when expiresAt passes
postSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Post', postSchema);



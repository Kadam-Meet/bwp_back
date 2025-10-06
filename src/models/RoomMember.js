const mongoose = require('mongoose');

const roomMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    joinedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Ensure unique combination of user and room
roomMemberSchema.index({ userId: 1, roomId: 1 }, { unique: true });

module.exports = mongoose.model('RoomMember', roomMemberSchema);

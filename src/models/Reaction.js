const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reactionType: { 
      type: String, 
      required: true, 
      enum: ['tea', 'spicy', 'cap', 'hearts'] 
    }
  },
  { timestamps: true }
);

// Ensure unique combination of user, post, and reaction type
reactionSchema.index({ postId: 1, userId: 1, reactionType: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', reactionSchema);

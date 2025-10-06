const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    rarity: { 
      type: String, 
      required: true, 
      enum: ['common', 'rare', 'legendary'] 
    },
    requirements: {
      postsRequired: { type: Number, default: 0 },
      reactionsRequired: { type: Number, default: 0 },
      daysActive: { type: Number, default: 0 },
      category: { type: String, default: null }
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Badge', badgeSchema);

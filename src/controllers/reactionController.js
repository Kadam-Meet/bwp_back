const Reaction = require('../models/Reaction');
const Post = require('../models/Post');
const User = require('../models/User');

// POST /reactions
async function addReaction(req, res) {
  console.log('🔵 [REACTION] POST /reactions - Request body:', req.body);
  try {
    const { postId, userId, reactionType } = req.body;
    
    if (!postId || !userId || !reactionType) {
      console.log('❌ [REACTION] Missing required fields');
      return res.status(400).json({ error: 'postId, userId, reactionType are required' });
    }

    if (!['tea', 'spicy', 'cap', 'hearts'].includes(reactionType)) {
      console.log('❌ [REACTION] Invalid reaction type');
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'post_not_found' });
    }

    // Remove any existing reaction from this user for this post
    await Reaction.deleteMany({ postId, userId });

    // Add new reaction
    const reaction = await Reaction.create({ postId, userId, reactionType });

    // Update user's total reactions
    await User.findByIdAndUpdate(userId, {
      $inc: { totalReactions: 1 },
      lastActiveAt: new Date()
    });

    console.log('✅ [REACTION] Reaction added successfully:', reaction._id);
    return res.status(201).json({
      id: reaction._id,
      postId: reaction.postId,
      userId: reaction.userId,
      reactionType: reaction.reactionType,
      createdAt: reaction.createdAt
    });
  } catch (err) {
    console.log('❌ [REACTION] Error adding reaction:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// DELETE /reactions
async function removeReaction(req, res) {
  console.log('🔵 [REACTION] DELETE /reactions - Request body:', req.body);
  try {
    const { postId, userId, reactionType } = req.body;
    
    if (!postId || !userId || !reactionType) {
      console.log('❌ [REACTION] Missing required fields');
      return res.status(400).json({ error: 'postId, userId, reactionType are required' });
    }

    const result = await Reaction.deleteOne({ postId, userId, reactionType });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'reaction_not_found' });
    }

    // Update user's total reactions
    await User.findByIdAndUpdate(userId, {
      $inc: { totalReactions: -1 }
    });

    console.log('✅ [REACTION] Reaction removed successfully');
    return res.status(200).json({ message: 'Reaction removed successfully' });
  } catch (err) {
    console.log('❌ [REACTION] Error removing reaction:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// GET /reactions/:postId
async function getPostReactions(req, res) {
  console.log('🔵 [REACTION] GET /reactions/:postId - Post ID:', req.params.postId);
  try {
    const postId = req.params.postId;
    console.log('🔵 [REACTION] Searching for reactions with postId:', postId);
    
    const reactions = await Reaction.find({ postId })
      .populate('userId', 'name alias anonymousId');

    console.log('🔵 [REACTION] Found', reactions.length, 'raw reactions');

    // Group reactions by type
    const reactionCounts = {
      tea: 0,
      spicy: 0,
      cap: 0,
      hearts: 0
    };

    reactions.forEach(reaction => {
      reactionCounts[reaction.reactionType]++;
    });

    console.log('✅ [REACTION] Reaction counts:', reactionCounts);
    console.log('✅ [REACTION] Total reactions:', reactions.length);
    
    const response = {
      postId: postId,
      reactions: reactionCounts,
      totalReactions: reactions.length,
      userReactions: reactions.map(r => ({
        userId: r.userId._id,
        user: {
          name: r.userId.name,
          alias: r.userId.alias,
          anonymousId: r.userId.anonymousId
        },
        reactionType: r.reactionType,
        createdAt: r.createdAt
      }))
    };
    
    console.log('✅ [REACTION] Sending response for post:', postId);
    return res.json(response);
  } catch (err) {
    console.log('❌ [REACTION] Error fetching reactions:', err.message);
    console.log('❌ [REACTION] Full error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

module.exports = {
  addReaction,
  removeReaction,
  getPostReactions,
};

const mongoose = require('mongoose');
const Reaction = require('../models/Reaction');
const Post = require('../models/Post');
const User = require('../models/User');

// POST /reactions
async function addReaction(req, res) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\n🔵 [REACTION-${requestId}] ===== ADD REACTION REQUEST =====`);
  console.log(`🔵 [REACTION-${requestId}] POST /reactions - Request body:`, JSON.stringify(req.body, null, 2));
  console.log(`🔵 [REACTION-${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`🔵 [REACTION-${requestId}] IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`🔵 [REACTION-${requestId}] User-Agent: ${req.get('User-Agent')}`);
  
  try {
    const { postId, userId, reactionType } = req.body;
    
    // Detailed validation logging
    console.log(`🔍 [REACTION-${requestId}] Validating input fields:`);
    console.log(`🔍 [REACTION-${requestId}] - postId: "${postId}" (type: ${typeof postId}, length: ${postId?.length})`);
    console.log(`🔍 [REACTION-${requestId}] - userId: "${userId}" (type: ${typeof userId}, length: ${userId?.length})`);
    console.log(`🔍 [REACTION-${requestId}] - reactionType: "${reactionType}" (type: ${typeof reactionType})`);
    
    if (!postId || !userId || !reactionType) {
      const missing = [];
      if (!postId) missing.push('postId');
      if (!userId) missing.push('userId');
      if (!reactionType) missing.push('reactionType');
      console.log(`❌ [REACTION-${requestId}] VALIDATION FAILED - Missing fields: ${missing.join(', ')}`);
      return res.status(400).json({ error: 'postId, userId, reactionType are required' });
    }

    if (!['tea', 'spicy', 'cap', 'hearts'].includes(reactionType)) {
      console.log(`❌ [REACTION-${requestId}] VALIDATION FAILED - Invalid reaction type: "${reactionType}"`);
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Handle demo user case
    if (userId === 'demo-user-id') {
      console.log(`🟡 [REACTION-${requestId}] DEMO USER DETECTED - Creating demo reaction without database storage`);
      console.log(`🔵 [REACTION-${requestId}] ===== DEMO REACTION SUCCESS =====\n`);
      return res.status(201).json({
        id: 'demo-reaction-' + Date.now(),
        postId: postId,
        userId: 'demo-user-id',
        reactionType: reactionType,
        createdAt: new Date().toISOString(),
        isDemo: true
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`❌ [REACTION-${requestId}] VALIDATION FAILED - Invalid userId format: "${userId}"`);
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      console.log(`❌ [REACTION-${requestId}] VALIDATION FAILED - Invalid postId format: "${postId}"`);
      return res.status(400).json({ error: 'Invalid postId format' });
    }

    console.log(`🟡 [REACTION-${requestId}] All validations passed, processing reaction...`);

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      console.log(`❌ [REACTION-${requestId}] POST NOT FOUND - postId: "${postId}"`);
      return res.status(404).json({ error: 'post_not_found' });
    }
    console.log(`✅ [REACTION-${requestId}] Post found: "${post.title}"`);

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ [REACTION-${requestId}] USER NOT FOUND - userId: "${userId}"`);
      return res.status(404).json({ error: 'user_not_found' });
    }
    console.log(`✅ [REACTION-${requestId}] User found: "${user.name}" (${user.email})`);

    // Remove any existing reaction from this user for this post
    const deletedReactions = await Reaction.deleteMany({ postId, userId });
    console.log(`🟡 [REACTION-${requestId}] Removed ${deletedReactions.deletedCount} existing reactions`);

    // Add new reaction
    const reaction = await Reaction.create({ postId, userId, reactionType });
    console.log(`✅ [REACTION-${requestId}] Reaction created with ID: ${reaction._id}`);

    // Update user's total reactions
    await User.findByIdAndUpdate(userId, {
      $inc: { totalReactions: 1 },
      lastActiveAt: new Date()
    });
    console.log(`✅ [REACTION-${requestId}] Updated user's total reactions`);

    console.log(`✅ [REACTION-${requestId}] REACTION ADDED SUCCESSFULLY!`);
    console.log(`🔵 [REACTION-${requestId}] ===== ADD REACTION SUCCESS =====\n`);
    
    return res.status(201).json({
      id: reaction._id,
      postId: reaction.postId,
      userId: reaction.userId,
      reactionType: reaction.reactionType,
      createdAt: reaction.createdAt
    });
  } catch (err) {
    console.log(`❌ [REACTION-${requestId}] ERROR ADDING REACTION:`);
    console.log(`❌ [REACTION-${requestId}] Error message: ${err.message}`);
    console.log(`❌ [REACTION-${requestId}] Error code: ${err.code || 'N/A'}`);
    console.log(`❌ [REACTION-${requestId}] Error stack: ${err.stack}`);
    console.log(`❌ [REACTION-${requestId}] Full error object:`, JSON.stringify(err, null, 2));
    console.log(`🔵 [REACTION-${requestId}] ===== ADD REACTION FAILED =====\n`);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// DELETE /reactions
async function removeReaction(req, res) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\n🔵 [REACTION-${requestId}] ===== REMOVE REACTION REQUEST =====`);
  console.log(`🔵 [REACTION-${requestId}] DELETE /reactions - Request body:`, JSON.stringify(req.body, null, 2));
  console.log(`🔵 [REACTION-${requestId}] IP: ${req.ip || req.connection.remoteAddress}`);
  
  try {
    const { postId, userId, reactionType } = req.body;
    
    // Detailed validation logging
    console.log(`🔍 [REACTION-${requestId}] Validating input fields:`);
    console.log(`🔍 [REACTION-${requestId}] - postId: "${postId}" (type: ${typeof postId})`);
    console.log(`🔍 [REACTION-${requestId}] - userId: "${userId}" (type: ${typeof userId})`);
    console.log(`🔍 [REACTION-${requestId}] - reactionType: "${reactionType}" (type: ${typeof reactionType})`);
    
    if (!postId || !userId || !reactionType) {
      const missing = [];
      if (!postId) missing.push('postId');
      if (!userId) missing.push('userId');
      if (!reactionType) missing.push('reactionType');
      console.log(`❌ [REACTION-${requestId}] VALIDATION FAILED - Missing fields: ${missing.join(', ')}`);
      return res.status(400).json({ error: 'postId, userId, reactionType are required' });
    }

    // Handle demo user case
    if (userId === 'demo-user-id') {
      console.log(`🟡 [REACTION-${requestId}] DEMO USER DETECTED - Removing demo reaction`);
      console.log(`🔵 [REACTION-${requestId}] ===== DEMO REACTION REMOVED =====\n`);
      return res.status(200).json({ message: 'Demo reaction removed successfully', isDemo: true });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`❌ [REACTION-${requestId}] VALIDATION FAILED - Invalid userId format: "${userId}"`);
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      console.log(`❌ [REACTION-${requestId}] VALIDATION FAILED - Invalid postId format: "${postId}"`);
      return res.status(400).json({ error: 'Invalid postId format' });
    }

    console.log(`🟡 [REACTION-${requestId}] All validations passed, removing reaction...`);

    const result = await Reaction.deleteOne({ postId, userId, reactionType });
    console.log(`🟡 [REACTION-${requestId}] Delete result: ${result.deletedCount} reactions removed`);

    if (result.deletedCount === 0) {
      console.log(`❌ [REACTION-${requestId}] REACTION NOT FOUND`);
      return res.status(404).json({ error: 'reaction_not_found' });
    }

    // Update user's total reactions
    await User.findByIdAndUpdate(userId, {
      $inc: { totalReactions: -1 }
    });
    console.log(`✅ [REACTION-${requestId}] Updated user's total reactions`);

    console.log(`✅ [REACTION-${requestId}] REACTION REMOVED SUCCESSFULLY!`);
    console.log(`🔵 [REACTION-${requestId}] ===== REMOVE REACTION SUCCESS =====\n`);
    return res.status(200).json({ message: 'Reaction removed successfully' });
  } catch (err) {
    console.log(`❌ [REACTION-${requestId}] ERROR REMOVING REACTION:`);
    console.log(`❌ [REACTION-${requestId}] Error message: ${err.message}`);
    console.log(`❌ [REACTION-${requestId}] Error stack: ${err.stack}`);
    console.log(`🔵 [REACTION-${requestId}] ===== REMOVE REACTION FAILED =====\n`);
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

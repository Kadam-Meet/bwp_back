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

    // Handle demo user case - implement proper demo reaction tracking
    if (userId === 'demo-user-id') {
      console.log(`🟡 [REACTION-${requestId}] DEMO USER DETECTED - Checking for existing demo reactions`);
      
      // For demo users, we'll use a simple in-memory tracking
      // In a real app, you might want to use Redis or a separate demo reactions collection
      const demoReactionKey = `demo_${postId}_${userId}`;
      
      // Check if demo user already has a reaction on this post
      // Since we can't use database, we'll return a consistent response
      // The frontend should handle demo user reaction state
      console.log(`🟡 [REACTION-${requestId}] Demo user reaction - returning success with demo flag`);
      console.log(`🔵 [REACTION-${requestId}] ===== DEMO REACTION SUCCESS =====\n`);
      return res.status(201).json({
        id: 'demo-reaction-' + Date.now(),
        postId: postId,
        userId: 'demo-user-id',
        reactionType: reactionType,
        createdAt: new Date().toISOString(),
        isDemo: true,
        message: 'Demo reaction - frontend should track state'
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

    // Check if user already has a reaction on this post
    const existingReaction = await Reaction.findOne({ postId, userId });
    
    if (existingReaction) {
      console.log(`🟡 [REACTION-${requestId}] User already has a reaction on this post: ${existingReaction.reactionType}`);
      
      // If it's the same reaction type, return the existing one
      if (existingReaction.reactionType === reactionType) {
        console.log(`🟡 [REACTION-${requestId}] Same reaction type, returning existing reaction`);
        return res.status(200).json({
          id: existingReaction._id,
          postId: existingReaction.postId,
          userId: existingReaction.userId,
          reactionType: existingReaction.reactionType,
          createdAt: existingReaction.createdAt,
          message: 'Reaction already exists'
        });
      }
      
      // Update the existing reaction to the new type
      existingReaction.reactionType = reactionType;
      await existingReaction.save();
      console.log(`✅ [REACTION-${requestId}] Updated existing reaction to: ${reactionType}`);
      
      return res.status(200).json({
        id: existingReaction._id,
        postId: existingReaction.postId,
        userId: existingReaction.userId,
        reactionType: existingReaction.reactionType,
        createdAt: existingReaction.createdAt,
        message: 'Reaction updated'
      });
    }

    // Create new reaction (user doesn't have any reaction on this post yet)
    const reaction = await Reaction.create({ postId, userId, reactionType });
    console.log(`✅ [REACTION-${requestId}] New reaction created with ID: ${reaction._id}`);

    // Update user's total reactions (only for new reactions, not updates)
    await User.findByIdAndUpdate(userId, {
      $inc: { totalReactions: 1 },
      lastActiveAt: new Date()
    });
    console.log(`✅ [REACTION-${requestId}] Updated user's total reactions for new reaction`);

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

    // Find the user's reaction on this post (regardless of type)
    const existingReaction = await Reaction.findOne({ postId, userId });
    
    if (!existingReaction) {
      console.log(`❌ [REACTION-${requestId}] NO REACTION FOUND for user on this post`);
      return res.status(404).json({ error: 'reaction_not_found' });
    }

    // Check if the reaction type matches what we're trying to remove
    if (existingReaction.reactionType !== reactionType) {
      console.log(`🟡 [REACTION-${requestId}] User's reaction type (${existingReaction.reactionType}) doesn't match requested type (${reactionType})`);
      return res.status(400).json({ 
        error: 'reaction_type_mismatch',
        currentReactionType: existingReaction.reactionType,
        requestedReactionType: reactionType
      });
    }

    // Remove the reaction
    await Reaction.deleteOne({ postId, userId });
    console.log(`✅ [REACTION-${requestId}] Reaction removed successfully`);

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
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\n🔵 [REACTION-${requestId}] ===== GET POST REACTIONS =====`);
  console.log(`🔵 [REACTION-${requestId}] GET /reactions/:postId - Post ID: ${req.params.postId}`);
  console.log(`🔵 [REACTION-${requestId}] Query params:`, req.query);
  
  try {
    const postId = req.params.postId;
    const userId = req.query.userId; // Optional: to get user's specific reaction
    
    console.log(`🔍 [REACTION-${requestId}] Searching for reactions with postId: ${postId}`);
    if (userId) {
      console.log(`🔍 [REACTION-${requestId}] Also checking for user's reaction: ${userId}`);
    }
    
    const reactions = await Reaction.find({ postId })
      .populate('userId', 'name alias anonymousId');

    console.log(`🔵 [REACTION-${requestId}] Found ${reactions.length} raw reactions`);

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

    console.log(`✅ [REACTION-${requestId}] Reaction counts:`, reactionCounts);
    console.log(`✅ [REACTION-${requestId}] Total reactions: ${reactions.length}`);
    
    // Find user's reaction if userId provided
    let userReaction = null;
    if (userId) {
      userReaction = reactions.find(r => r.userId._id.toString() === userId);
      if (userReaction) {
        console.log(`✅ [REACTION-${requestId}] User's reaction found: ${userReaction.reactionType}`);
      } else {
        console.log(`🔍 [REACTION-${requestId}] No reaction found for user: ${userId}`);
      }
    }
    
    const response = {
      postId: postId,
      reactions: reactionCounts,
      totalReactions: reactions.length,
      userReaction: userReaction ? {
        reactionType: userReaction.reactionType,
        createdAt: userReaction.createdAt
      } : null,
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
    
    console.log(`✅ [REACTION-${requestId}] Sending response for post: ${postId}`);
    console.log(`🔵 [REACTION-${requestId}] ===== GET POST REACTIONS SUCCESS =====\n`);
    return res.json(response);
  } catch (err) {
    console.log(`❌ [REACTION-${requestId}] Error fetching reactions: ${err.message}`);
    console.log(`❌ [REACTION-${requestId}] Full error:`, err);
    console.log(`🔵 [REACTION-${requestId}] ===== GET POST REACTIONS FAILED =====\n`);
    return res.status(500).json({ error: 'internal_error' });
  }
}

module.exports = {
  addReaction,
  removeReaction,
  getPostReactions,
};

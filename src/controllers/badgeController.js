const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const Post = require('../models/Post');
const Reaction = require('../models/Reaction');
const User = require('../models/User');

// GET /badges/:userId
async function getUserBadges(req, res) {
  console.log('🔵 [BADGE] GET /badges/:userId - Fetching user badges:', req.params.userId);
  try {
    const userId = req.params.userId;
    
    // Get all available badges
    const allBadges = await Badge.find({ isActive: true });
    
    // Get user's earned badges
    const userBadges = await UserBadge.find({ userId }).populate('badgeId');
    
    // Get user stats for badge calculation
    const userStats = await calculateUserStats(userId);
    
    // Calculate which badges the user has earned
    const badgesWithStatus = allBadges.map(badge => {
      const userBadge = userBadges.find(ub => ub.badgeId._id.toString() === badge._id.toString());
      const isEarned = !!userBadge;
      
      // Check if user meets requirements for this badge
      const meetsRequirements = checkBadgeRequirements(badge, userStats);
      
      return {
        id: badge._id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        earned: isEarned,
        earnedAt: userBadge ? userBadge.earnedAt : null,
        meetsRequirements: meetsRequirements && !isEarned, // Can earn but hasn't yet
        requirements: badge.requirements
      };
    });
    
    console.log('✅ [BADGE] Found', badgesWithStatus.length, 'badges for user');
    return res.json(badgesWithStatus);
  } catch (err) {
    console.log('❌ [BADGE] Error fetching user badges:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// Helper function to calculate user stats
async function calculateUserStats(userId) {
  // Get user's posts
  const posts = await Post.find({ authorId: userId });
  
  // Calculate total reactions across all posts
  let totalReactions = 0;
  let categoryStats = {};
  
  for (const post of posts) {
    const reactions = await Reaction.find({ postId: post._id });
    const postReactions = reactions.length;
    totalReactions += postReactions;
    
    // Count posts by category
    categoryStats[post.category] = (categoryStats[post.category] || 0) + 1;
  }
  
  // Calculate days since user joined
  const user = await User.findById(userId);
  const daysSinceJoined = user ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0;
  
  // Calculate days active (days with at least one post)
  const postDates = posts.map(post => post.createdAt.toDateString());
  const uniqueActiveDays = new Set(postDates).size;
  
  return {
    totalPosts: posts.length,
    totalReactions,
    daysSinceJoined,
    daysActive: uniqueActiveDays,
    categoryStats,
    topCategory: Object.keys(categoryStats).reduce((a, b) => 
      categoryStats[a] > categoryStats[b] ? a : b, 'General'
    )
  };
}

// Helper function to check if user meets badge requirements
function checkBadgeRequirements(badge, userStats) {
  const req = badge.requirements;
  
  // Check posts requirement
  if (req.postsRequired && userStats.totalPosts < req.postsRequired) {
    return false;
  }
  
  // Check reactions requirement
  if (req.reactionsRequired && userStats.totalReactions < req.reactionsRequired) {
    return false;
  }
  
  // Check days active requirement
  if (req.daysActive && userStats.daysActive < req.daysActive) {
    return false;
  }
  
  // Check category requirement
  if (req.category && userStats.categoryStats[req.category] < 1) {
    return false;
  }
  
  return true;
}

// POST /badges/:userId/check
async function checkAndAwardBadges(req, res) {
  console.log('🔵 [BADGE] POST /badges/:userId/check - Checking for new badges:', req.params.userId);
  try {
    const userId = req.params.userId;
    
    // Get all available badges
    const allBadges = await Badge.find({ isActive: true });
    
    // Get user's already earned badges
    const userBadges = await UserBadge.find({ userId });
    const earnedBadgeIds = userBadges.map(ub => ub.badgeId.toString());
    
    // Get user stats
    const userStats = await calculateUserStats(userId);
    
    // Check for new badges
    const newBadges = [];
    
    for (const badge of allBadges) {
      if (!earnedBadgeIds.includes(badge._id.toString())) {
        if (checkBadgeRequirements(badge, userStats)) {
          // Award the badge
          const userBadge = new UserBadge({
            userId,
            badgeId: badge._id,
            earnedAt: new Date()
          });
          
          await userBadge.save();
          newBadges.push({
            id: badge._id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            rarity: badge.rarity,
            earnedAt: userBadge.earnedAt
          });
        }
      }
    }
    
    console.log('✅ [BADGE] Awarded', newBadges.length, 'new badges');
    return res.json({ newBadges, totalNew: newBadges.length });
  } catch (err) {
    console.log('❌ [BADGE] Error checking badges:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

module.exports = {
  getUserBadges,
  checkAndAwardBadges
};

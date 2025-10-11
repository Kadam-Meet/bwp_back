const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Reaction = require('../models/Reaction');

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateAnonymousId() {
  // Simple UUID v4 generator without external deps
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateAlias() {
  const adjectives = ['Ghost', 'Mystery', 'Shadow', 'Whisper', 'Cinder', 'Nebula', 'Echo', 'Aurora', 'Zephyr'];
  const nouns = ['Sipper', 'Spiller', 'Brewer', 'Taster', 'Watcher', 'Drifter', 'Wanderer', 'Story', 'Spark'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${noun}-${num}`;
}

// POST /users
async function createUser(req, res) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\n🔵 [USER-${requestId}] ===== SIGNUP REQUEST =====`);
  console.log(`🔵 [USER-${requestId}] POST /users - Request body:`, JSON.stringify(req.body, null, 2));
  console.log(`🔵 [USER-${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`🔵 [USER-${requestId}] IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`🔵 [USER-${requestId}] User-Agent: ${req.get('User-Agent')}`);
  
  try {
    const { name, email, password } = req.body;
    
    // Detailed validation logging
    console.log(`🔍 [USER-${requestId}] Validating input fields:`);
    console.log(`🔍 [USER-${requestId}] - name: "${name}" (type: ${typeof name}, length: ${name?.length})`);
    console.log(`🔍 [USER-${requestId}] - email: "${email}" (type: ${typeof email}, length: ${email?.length})`);
    console.log(`🔍 [USER-${requestId}] - password: "${password ? '[PROVIDED]' : '[MISSING]'}" (type: ${typeof password}, length: ${password?.length})`);
    
    if (!name || !email || !password) {
      const missing = [];
      if (!name) missing.push('name');
      if (!email) missing.push('email');
      if (!password) missing.push('password');
      console.log(`❌ [USER-${requestId}] VALIDATION FAILED - Missing fields: ${missing.join(', ')}`);
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    
    if (!isValidEmail(email)) {
      console.log(`❌ [USER-${requestId}] VALIDATION FAILED - Invalid email format: "${email}"`);
      return res.status(400).json({ error: 'invalid_email' });
    }
    
    console.log(`🟡 [USER-${requestId}] All validations passed, creating user...`);
    console.log(`🟡 [USER-${requestId}] User data: { name: "${name}", email: "${email}", password: "[HIDDEN]" }`);
    
    // Generate alias and anonymousId for new users
    const alias = generateAlias();
    const anonymousId = generateAnonymousId();
    console.log(`🟡 [USER-${requestId}] Generated alias: "${alias}"`);
    console.log(`🟡 [USER-${requestId}] Generated anonymousId: "${anonymousId}"`);
    
    const user = await User.create({ name, email, password, alias, anonymousId });
    
    console.log(`✅ [USER-${requestId}] USER CREATED SUCCESSFULLY!`);
    console.log(`✅ [USER-${requestId}] User ID: ${user._id}`);
    console.log(`✅ [USER-${requestId}] User name: ${user.name}`);
    console.log(`✅ [USER-${requestId}] User email: ${user.email}`);
    console.log(`✅ [USER-${requestId}] User alias: ${user.alias}`);
    console.log(`✅ [USER-${requestId}] User anonymousId: ${user.anonymousId}`);
    console.log(`✅ [USER-${requestId}] Created at: ${user.createdAt}`);
    console.log(`🔵 [USER-${requestId}] ===== SIGNUP SUCCESS =====\n`);
    
    return res.status(201).json({ 
      id: user._id, 
      name: user.name, 
      email: user.email,
      alias: user.alias,
      anonymousId: user.anonymousId
    });
  } catch (err) {
    console.log(`❌ [USER-${requestId}] ERROR CREATING USER:`);
    console.log(`❌ [USER-${requestId}] Error message: ${err.message}`);
    console.log(`❌ [USER-${requestId}] Error code: ${err.code || 'N/A'}`);
    console.log(`❌ [USER-${requestId}] Error stack: ${err.stack}`);
    console.log(`❌ [USER-${requestId}] Full error object:`, JSON.stringify(err, null, 2));
    
    if (err && err.code === 11000) {
      console.log(`❌ [USER-${requestId}] DUPLICATE EMAIL ERROR - Email already exists: "${req.body.email}"`);
      console.log(`🔵 [USER-${requestId}] ===== SIGNUP FAILED (DUPLICATE) =====\n`);
      return res.status(409).json({ error: 'email already exists' });
    }
    
    console.log(`🔵 [USER-${requestId}] ===== SIGNUP FAILED (INTERNAL ERROR) =====\n`);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// GET /users
async function listUsers(_req, res) {
  console.log('🔵 [USER] GET /users - Fetching all users');
  try {
    const users = await User.find({}, { name: 1, email: 1 }).sort({ createdAt: -1 });
    console.log('✅ [USER] Found', users.length, 'users');
    return res.json(users.map((u) => ({ id: u._id, name: u.name, email: u.email })));
  } catch (err) {
    console.log('❌ [USER] Error fetching users:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// POST /users/login
async function loginUser(req, res) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\n🔵 [LOGIN-${requestId}] ===== LOGIN REQUEST =====`);
  console.log(`🔵 [LOGIN-${requestId}] POST /users/login - Request body:`, JSON.stringify(req.body, null, 2));
  console.log(`🔵 [LOGIN-${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`🔵 [LOGIN-${requestId}] IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`🔵 [LOGIN-${requestId}] User-Agent: ${req.get('User-Agent')}`);
  
  try {
    const { email, password } = req.body || {};
    
    // Detailed validation logging
    console.log(`🔍 [LOGIN-${requestId}] Validating input fields:`);
    console.log(`🔍 [LOGIN-${requestId}] - email: "${email}" (type: ${typeof email}, length: ${email?.length})`);
    console.log(`🔍 [LOGIN-${requestId}] - password: "${password ? '[PROVIDED]' : '[MISSING]'}" (type: ${typeof password}, length: ${password?.length})`);
    
    if (!email || !password) {
      const missing = [];
      if (!email) missing.push('email');
      if (!password) missing.push('password');
      console.log(`❌ [LOGIN-${requestId}] VALIDATION FAILED - Missing fields: ${missing.join(', ')}`);
      return res.status(400).json({ error: 'email and password are required' });
    }
    
    if (!isValidEmail(email)) {
      console.log(`❌ [LOGIN-${requestId}] VALIDATION FAILED - Invalid email format: "${email}"`);
      return res.status(400).json({ error: 'invalid_email' });
    }
    
    console.log(`🟡 [LOGIN-${requestId}] All validations passed, searching for user...`);
    console.log(`🟡 [LOGIN-${requestId}] Searching for user with email: "${email}"`);
    
    let user = await User.findOne({ email, password });
    if (!user) {
      console.log(`❌ [LOGIN-${requestId}] LOGIN FAILED - No user found with email: "${email}"`);
      console.log(`❌ [LOGIN-${requestId}] This could mean:`);
      console.log(`❌ [LOGIN-${requestId}] 1. Email doesn't exist in database`);
      console.log(`❌ [LOGIN-${requestId}] 2. Password is incorrect`);
      console.log(`❌ [LOGIN-${requestId}] 3. User account was deleted`);
      console.log(`🔵 [LOGIN-${requestId}] ===== LOGIN FAILED (INVALID CREDENTIALS) =====\n`);
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    
    console.log(`✅ [LOGIN-${requestId}] LOGIN SUCCESSFUL!`);
    console.log(`✅ [LOGIN-${requestId}] User ID: ${user._id}`);
    console.log(`✅ [LOGIN-${requestId}] User name: ${user.name}`);
    console.log(`✅ [LOGIN-${requestId}] User email: ${user.email}`);
    console.log(`✅ [LOGIN-${requestId}] User alias: ${user.alias || 'None'}`);
    console.log(`✅ [LOGIN-${requestId}] User anonymousId: ${user.anonymousId || 'None'}`);
    console.log(`✅ [LOGIN-${requestId}] User created at: ${user.createdAt}`);
    
    // Backfill alias/anonymousId if missing for existing users
    let needsSave = false;
    if (!user.alias) {
      user.alias = generateAlias();
      needsSave = true;
      console.log(`🟡 [LOGIN-${requestId}] Backfilled missing alias: "${user.alias}"`);
    }
    if (!user.anonymousId) {
      user.anonymousId = generateAnonymousId();
      needsSave = true;
      console.log(`🟡 [LOGIN-${requestId}] Backfilled missing anonymousId: "${user.anonymousId}"`);
    }
    
    if (needsSave) {
      try {
        await user.save();
        console.log(`✅ [LOGIN-${requestId}] User updated with backfilled data`);
      } catch (saveErr) {
        console.log(`⚠️ [LOGIN-${requestId}] Warning: Could not save backfilled data: ${saveErr.message}`);
      }
    }
    
    console.log(`🔵 [LOGIN-${requestId}] ===== LOGIN SUCCESS =====\n`);
    
    return res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      alias: user.alias || null, 
      anonymousId: user.anonymousId || null 
    });
  } catch (err) {
    console.log(`❌ [LOGIN-${requestId}] ERROR DURING LOGIN:`);
    console.log(`❌ [LOGIN-${requestId}] Error message: ${err.message}`);
    console.log(`❌ [LOGIN-${requestId}] Error code: ${err.code || 'N/A'}`);
    console.log(`❌ [LOGIN-${requestId}] Error stack: ${err.stack}`);
    console.log(`❌ [LOGIN-${requestId}] Full error object:`, JSON.stringify(err, null, 2));
    console.log(`🔵 [LOGIN-${requestId}] ===== LOGIN FAILED (INTERNAL ERROR) =====\n`);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// POST /users/anonymous
async function createAnonymous(req, res) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\n🔵 [ANON-${requestId}] ===== ANONYMOUS REQUEST =====`);
  console.log(`🔵 [ANON-${requestId}] POST /users/anonymous - Request body:`, JSON.stringify(req.body, null, 2));
  console.log(`🔵 [ANON-${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`🔵 [ANON-${requestId}] IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`🔵 [ANON-${requestId}] User-Agent: ${req.get('User-Agent')}`);
  
  try {
    console.log(`🟡 [ANON-${requestId}] Generating anonymous identity...`);
    
    const alias = generateAlias();
    const anonymousId = generateAnonymousId();
    
    console.log(`✅ [ANON-${requestId}] ANONYMOUS IDENTITY CREATED!`);
    console.log(`✅ [ANON-${requestId}] Generated alias: "${alias}"`);
    console.log(`✅ [ANON-${requestId}] Generated anonymousId: "${anonymousId}"`);
    console.log(`✅ [ANON-${requestId}] Note: Anonymous users are not persisted to database`);
    console.log(`🔵 [ANON-${requestId}] ===== ANONYMOUS SUCCESS =====\n`);
    
    // We do not persist anonymous users to DB to avoid required fields; frontend can use this session ephemeral identity.
    return res.status(201).json({ 
      id: null, 
      name: alias, 
      email: null, 
      alias, 
      anonymousId 
    });
  } catch (err) {
    console.log(`❌ [ANON-${requestId}] ERROR CREATING ANONYMOUS IDENTITY:`);
    console.log(`❌ [ANON-${requestId}] Error message: ${err.message}`);
    console.log(`❌ [ANON-${requestId}] Error code: ${err.code || 'N/A'}`);
    console.log(`❌ [ANON-${requestId}] Error stack: ${err.stack}`);
    console.log(`❌ [ANON-${requestId}] Full error object:`, JSON.stringify(err, null, 2));
    console.log(`🔵 [ANON-${requestId}] ===== ANONYMOUS FAILED =====\n`);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// GET /users/test - Simple test endpoint
async function testEndpoint(req, res) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\n🔵 [TEST-${requestId}] ===== TEST ENDPOINT =====`);
  console.log(`🔵 [TEST-${requestId}] GET /users/test - Testing authentication system`);
  console.log(`🔵 [TEST-${requestId}] IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`🔵 [TEST-${requestId}] User-Agent: ${req.get('User-Agent')}`);
  
  try {
    // Test database connection
    const userCount = await User.countDocuments();
    console.log(`✅ [TEST-${requestId}] Database connection successful`);
    console.log(`✅ [TEST-${requestId}] Total users in database: ${userCount}`);
    
    const response = {
      status: 'success',
      message: 'Authentication system is working',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        userCount: userCount
      },
      endpoints: {
        signup: 'POST /api/users',
        login: 'POST /api/users/login',
        anonymous: 'POST /api/users/anonymous',
        list: 'GET /api/users'
      }
    };
    
    console.log(`✅ [TEST-${requestId}] Test completed successfully`);
    console.log(`🔵 [TEST-${requestId}] ===== TEST SUCCESS =====\n`);
    
    return res.json(response);
  } catch (err) {
    console.log(`❌ [TEST-${requestId}] TEST FAILED:`);
    console.log(`❌ [TEST-${requestId}] Error message: ${err.message}`);
    console.log(`❌ [TEST-${requestId}] Error stack: ${err.stack}`);
    console.log(`🔵 [TEST-${requestId}] ===== TEST FAILED =====\n`);
    
    return res.status(500).json({
      status: 'error',
      message: 'Authentication system test failed',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
}

// POST /users/logout
async function logoutUser(req, res) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\n🔵 [LOGOUT-${requestId}] ===== LOGOUT REQUEST =====`);
  console.log(`🔵 [LOGOUT-${requestId}] POST /users/logout - Request body:`, JSON.stringify(req.body, null, 2));
  console.log(`🔵 [LOGOUT-${requestId}] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`🔵 [LOGOUT-${requestId}] IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`🔵 [LOGOUT-${requestId}] User-Agent: ${req.get('User-Agent')}`);
  
  try {
    const { userId } = req.body || {};
    
    console.log(`🔍 [LOGOUT-${requestId}] Validating logout request:`);
    console.log(`🔍 [LOGOUT-${requestId}] - userId: "${userId}" (type: ${typeof userId})`);
    
    // Handle demo user case
    if (userId === 'demo-user-id') {
      console.log(`🟡 [LOGOUT-${requestId}] DEMO USER LOGOUT - No database action needed`);
      console.log(`🔵 [LOGOUT-${requestId}] ===== DEMO LOGOUT SUCCESS =====\n`);
      return res.status(200).json({ 
        message: 'Demo user logged out successfully',
        isDemo: true 
      });
    }
    
    // For real users, we could update lastActiveAt or perform cleanup
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`🟡 [LOGOUT-${requestId}] Updating user's last active time...`);
      await User.findByIdAndUpdate(userId, {
        lastActiveAt: new Date()
      });
      console.log(`✅ [LOGOUT-${requestId}] Updated user's last active time`);
    }
    
    console.log(`✅ [LOGOUT-${requestId}] LOGOUT SUCCESSFUL!`);
    console.log(`🔵 [LOGOUT-${requestId}] ===== LOGOUT SUCCESS =====\n`);
    
    return res.status(200).json({ 
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.log(`❌ [LOGOUT-${requestId}] ERROR DURING LOGOUT:`);
    console.log(`❌ [LOGOUT-${requestId}] Error message: ${err.message}`);
    console.log(`❌ [LOGOUT-${requestId}] Error stack: ${err.stack}`);
    console.log(`🔵 [LOGOUT-${requestId}] ===== LOGOUT FAILED =====\n`);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// GET /users/:id/stats
async function getUserStats(req, res) {
  console.log('🔵 [USER] GET /users/:id/stats - Fetching user stats:', req.params.id);
  try {
    const userId = req.params.id;
    
    // Get user's posts
    const posts = await Post.find({ authorId: userId });
    
    // Calculate stats
    const totalPosts = posts.length;
    
    // Get total reactions across all posts
    let totalReactions = 0;
    for (const post of posts) {
      const reactions = await Reaction.find({ postId: post._id });
      const postReactions = reactions.reduce((sum, reaction) => {
        return sum + (reaction.reactionType === 'tea' ? 1 : 0) +
               (reaction.reactionType === 'spicy' ? 1 : 0) +
               (reaction.reactionType === 'cap' ? 1 : 0) +
               (reaction.reactionType === 'hearts' ? 1 : 0);
      }, 0);
      totalReactions += postReactions;
    }
    
    // Find top category
    const categoryCount = {};
    posts.forEach(post => {
      categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;
    });
    const topCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'General'
    );
    
    // Get user info for member since
    const user = await User.findById(userId);
    const memberSince = user ? new Date(user.createdAt).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }) : 'Unknown';
    
    // Calculate streak (simplified - days since last post)
    const lastPost = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const streak = lastPost ? Math.floor((new Date() - new Date(lastPost.createdAt)) / (1000 * 60 * 60 * 24)) : 0;
    
    const averageReactions = totalPosts > 0 ? Math.round(totalReactions / totalPosts) : 0;
    
    console.log('✅ [USER] User stats calculated:', {
      totalPosts,
      totalReactions,
      topCategory,
      memberSince,
      streak,
      averageReactions
    });
    
    return res.json({
      totalPosts,
      totalReactions,
      topCategory,
      memberSince,
      streak,
      averageReactions
    });
  } catch (err) {
    console.log('❌ [USER] Error fetching user stats:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

module.exports = {
  createUser,
  listUsers,
  loginUser,
  createAnonymous,
  logoutUser,
  testEndpoint,
  getUserStats,
};



const Post = require('../models/Post');
const Room = require('../models/Room');
const User = require('../models/User');

// POST /posts
async function createPost(req, res) {
  console.log('🔵 [POST] POST /posts - Request body:', req.body);
  try {
    const { title, content, authorId, roomId, category, duration, isVoiceNote } = req.body;
    if (!title || !content || !authorId || !roomId) {
      console.log('❌ [POST] Missing required fields');
      return res.status(400).json({ error: 'title, content, authorId, roomId are required' });
    }

    // Calculate expiration date based on duration
    let expiresAt = null;
    if (duration && duration !== 'permanent') {
      const now = new Date();
      if (duration === '24h') {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (duration === '7d') {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    console.log('🟡 [POST] Creating post with:', { title, authorId, roomId, category, duration });
    const post = await Post.create({ 
      title, 
      content, 
      authorId, 
      roomId, 
      category: category || 'General',
      duration: duration || 'permanent',
      isVoiceNote: isVoiceNote || false,
      expiresAt
    });

    // Update room's last activity and post count
    await Room.findByIdAndUpdate(roomId, {
      $inc: { recentPostCount: 1 },
      lastActivity: new Date()
    });

    // Update user's post count
    await User.findByIdAndUpdate(authorId, {
      $inc: { totalPosts: 1 },
      lastActiveAt: new Date()
    });

    console.log('✅ [POST] Post created successfully:', post._id);
    return res.status(201).json({ 
      id: post._id, 
      title: post.title, 
      content: post.content,
      authorId: post.authorId,
      roomId: post.roomId,
      category: post.category,
      duration: post.duration,
      isVoiceNote: post.isVoiceNote,
      expiresAt: post.expiresAt,
      createdAt: post.createdAt
    });
  } catch (err) {
    console.log('❌ [POST] Error creating post:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// GET /posts
async function listPosts(req, res) {
  console.log('🔵 [POST] GET /posts - Fetching posts');
  console.log('🔵 [POST] Query params:', req.query);
  try {
    const { roomId, limit = 20, offset = 0 } = req.query;
    
    let query = { isExpired: { $ne: true } };
    if (roomId) {
      query.roomId = roomId;
      console.log('🔵 [POST] Filtering by roomId:', roomId);
    }

    console.log('🔵 [POST] MongoDB query:', JSON.stringify(query));
    const posts = await Post.find(query)
      .populate('authorId', 'name alias anonymousId')
      .populate('roomId', 'name icon gradient')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    console.log('✅ [POST] Found', posts.length, 'posts');
    console.log('✅ [POST] Sample post:', posts[0] ? {
      id: posts[0]._id,
      title: posts[0].title,
      author: posts[0].authorId?.name,
      room: posts[0].roomId?.name
    } : 'No posts found');
    
    const response = posts.map((p) => ({
      id: p._id,
      title: p.title,
      content: p.content,
      authorId: p.authorId._id,
      author: {
        name: p.authorId.name,
        alias: p.authorId.alias,
        anonymousId: p.authorId.anonymousId
      },
      room: {
        id: p.roomId._id,
        name: p.roomId.name,
        icon: p.roomId.icon,
        gradient: p.roomId.gradient
      },
      category: p.category,
      duration: p.duration,
      isVoiceNote: p.isVoiceNote,
      expiresAt: p.expiresAt,
      createdAt: p.createdAt
    }));
    
    console.log('✅ [POST] Sending response with', response.length, 'posts');
    return res.json(response);
  } catch (err) {
    console.log('❌ [POST] Error fetching posts:', err.message);
    console.log('❌ [POST] Full error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

module.exports = {
  createPost,
  listPosts,
};



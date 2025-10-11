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

    // Enforce 24-hour expiration for all posts by default
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log('🟡 [POST] Creating post with:', { title, authorId, roomId, category, duration });
    const post = await Post.create({ 
      title, 
      content, 
      authorId, 
      roomId, 
      category: category || 'General',
      duration: '24h',
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
    
    // Exclude expired posts explicitly and by expiresAt
    let query = { 
      isExpired: { $ne: true },
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };
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
  // export for route usage
  deletePost: async function deletePost(req, res) {
    const { id } = req.params;
    console.log('🔴 [POST] DELETE /posts/:id -', id);
    try {
      // Extract userId from common locations
      const userIdFromHeader = req.get && req.get('x-user-id');
      const userId = (req.body && req.body.userId) || (req.query && req.query.userId) || userIdFromHeader;

      if (!userId) {
        console.log('❌ [POST] Missing userId for delete');
        return res.status(400).json({ error: 'userId_required' });
      }

      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({ error: 'not_found' });
      }

      // Owner-only deletion enforcement
      if (String(post.authorId) !== String(userId)) {
        console.log('⛔ [POST] Delete forbidden: requester is not the post owner', {
          requester: String(userId),
          owner: String(post.authorId),
          postId: String(post._id)
        });
        return res.status(403).json({ error: 'forbidden_not_owner' });
      }

      // Best-effort cascade delete reactions and comments
      await Promise.all([
        require('../models/Reaction').deleteMany({ postId: id }),
        require('../models/Comment').deleteMany({ postId: id }),
      ]);

      await Post.deleteOne({ _id: id });

      // Decrement counters (best-effort)
      const Room = require('../models/Room');
      const User = require('../models/User');
      await Promise.allSettled([
        Room.findByIdAndUpdate(post.roomId, { $inc: { recentPostCount: -1 } }),
        User.findByIdAndUpdate(post.authorId, { $inc: { totalPosts: -1 } })
      ]);

      console.log('✅ [POST] Deleted post and relations', { postId: id });
      return res.json({ success: true });
    } catch (err) {
      console.log('❌ [POST] Error deleting post:', err.message);
      return res.status(500).json({ error: 'internal_error' });
    }
  },
};



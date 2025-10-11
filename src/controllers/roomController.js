const Room = require('../models/Room');
const Post = require('../models/Post');

// GET /rooms
async function listRooms(req, res) {
  console.log('🔵 [ROOM] GET /rooms - Fetching all rooms');
  console.log('🔵 [ROOM] Query params:', req.query);
  try {
    const { trending } = req.query;
    
    let query = {};
    if (trending === 'true') {
      query.isTrending = true;
      console.log('🔵 [ROOM] Filtering for trending rooms');
    }

    console.log('🔵 [ROOM] MongoDB query:', JSON.stringify(query));
    const rooms = await Room.find(query).sort({ 
      isTrending: -1, 
      memberCount: -1, 
      lastActivity: -1 
    });

    console.log('✅ [ROOM] Found', rooms.length, 'rooms');
    console.log('✅ [ROOM] Sample room:', rooms[0] ? {
      id: rooms[0]._id,
      name: rooms[0].name,
      isTrending: rooms[0].isTrending
    } : 'No rooms found');
    
    const response = rooms.map(room => ({
      id: room._id,
      name: room.name,
      description: room.description,
      icon: room.icon,
      gradient: room.gradient,
      isTrending: room.isTrending,
      memberCount: room.memberCount,
      recentPostCount: room.recentPostCount,
      lastActivity: room.lastActivity,
      createdAt: room.createdAt
    }));
    
    console.log('✅ [ROOM] Sending response with', response.length, 'rooms');
    return res.json(response);
  } catch (err) {
    console.log('❌ [ROOM] Error fetching rooms:', err.message);
    console.log('❌ [ROOM] Full error:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// GET /rooms/:id
async function getRoom(req, res) {
  console.log('🔵 [ROOM] GET /rooms/:id - Fetching room:', req.params.id);
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'room_not_found' });
    }

    // Get recent posts for this room
    const recentPosts = await Post.find({ roomId: req.params.id, isExpired: { $ne: true } })
      .populate('authorId', 'name alias anonymousId')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('✅ [ROOM] Found room with', recentPosts.length, 'recent posts');
    return res.json({
      id: room._id,
      name: room.name,
      description: room.description,
      icon: room.icon,
      gradient: room.gradient,
      isTrending: room.isTrending,
      memberCount: room.memberCount,
      recentPostCount: room.recentPostCount,
      lastActivity: room.lastActivity,
      recentPosts: recentPosts.map(post => ({
        id: post._id,
        title: post.title,
        content: post.content,
        author: {
          name: post.authorId.name,
          alias: post.authorId.alias,
          anonymousId: post.authorId.anonymousId
        },
        category: post.category,
        isVoiceNote: post.isVoiceNote,
        createdAt: post.createdAt
      })),
      createdAt: room.createdAt
    });
  } catch (err) {
    console.log('❌ [ROOM] Error fetching room:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// POST /rooms
async function createRoom(req, res) {
  console.log('🔵 [ROOM] POST /rooms - Creating new room');
  console.log('🔵 [ROOM] Request body:', req.body);
  try {
    const { name, description, icon, gradient, category } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ error: 'name_and_description_required' });
    }

    // Create new room
    const newRoom = new Room({
      name,
      description,
      icon: icon || '🏠',
      gradient: gradient || 'bg-gradient-to-br from-blue-500 to-purple-600',
      category: category || 'General',
      memberCount: 0,
      recentPostCount: 0,
      isTrending: false,
      lastActivity: 'Just created'
    });

    const savedRoom = await newRoom.save();
    console.log('✅ [ROOM] Room created successfully:', savedRoom._id);

    return res.status(201).json({
      id: savedRoom._id,
      name: savedRoom.name,
      description: savedRoom.description,
      icon: savedRoom.icon,
      gradient: savedRoom.gradient,
      category: savedRoom.category,
      isTrending: savedRoom.isTrending,
      memberCount: savedRoom.memberCount,
      recentPostCount: savedRoom.recentPostCount,
      lastActivity: savedRoom.lastActivity,
      createdAt: savedRoom.createdAt
    });
  } catch (err) {
    console.log('❌ [ROOM] Error creating room:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

module.exports = {
  listRooms,
  getRoom,
  createRoom,
};

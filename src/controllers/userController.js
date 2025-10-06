const User = require('../models/User');

// POST /users
async function createUser(req, res) {
  console.log('🔵 [USER] POST /users - Request body:', req.body);
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      console.log('❌ [USER] Missing required fields');
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    console.log('🟡 [USER] Creating user with:', { name, email });
    const user = await User.create({ name, email, password });
    console.log('✅ [USER] User created successfully:', user._id);
    return res.status(201).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.log('❌ [USER] Error creating user:', err.message);
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'email already exists' });
    }
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

module.exports = {
  createUser,
  listUsers,
};



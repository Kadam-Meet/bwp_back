const User = require('../models/User');

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
  console.log('🔵 [USER] POST /users - Request body:', req.body);
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      console.log('❌ [USER] Missing required fields');
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'invalid_email' });
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

// POST /users/login
async function loginUser(req, res) {
  console.log('🔵 [USER] POST /users/login - Request body:', req.body);
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    return res.json({ id: user._id, name: user.name, email: user.email, alias: user.alias || null, anonymousId: user.anonymousId || null });
  } catch (err) {
    console.log('❌ [USER] Error during login:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// POST /users/anonymous
async function createAnonymous(_req, res) {
  console.log('🔵 [USER] POST /users/anonymous - Generating anonymous identity');
  try {
    const alias = generateAlias();
    const anonymousId = generateAnonymousId();
    // We do not persist anonymous users to DB to avoid required fields; frontend can use this session ephemeral identity.
    return res.status(201).json({ id: null, name: alias, email: null, alias, anonymousId });
  } catch (err) {
    console.log('❌ [USER] Error creating anonymous identity:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

module.exports = {
  createUser,
  listUsers,
  loginUser,
  createAnonymous,
};



// Main entry point: Express server with MongoDB connection and auto-migrations
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectWithRetry, getMongooseConnection } = require('./src/config/db');
const runMigrations = require('./src/migrations');
const { trackUserSession, getSessionStats } = require('./src/middleware/sessionTracker');

const app = express();
const PORT = process.env.PORT || 5500;

// Middlewares
app.use(cors());
app.use(express.json());

// Session tracking for frontend actions
app.use(trackUserSession);

// COMPREHENSIVE FRONTEND ACTION LOGGING
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  const referer = req.get('Referer') || 'Direct';
  const origin = req.get('Origin') || 'Unknown';
  
  // Determine if this is a frontend action
  const isFrontendAction = path.startsWith('/api/') || path.includes('posts') || path.includes('rooms') || path.includes('users') || path.includes('reactions');
  const actionType = isFrontendAction ? '🎯 FRONTEND ACTION' : '🌐 API REQUEST';
  
  console.log(`\n${actionType} ===== NEW REQUEST =====`);
  console.log(`${actionType} [${timestamp}] ${method} ${path}`);
  console.log(`${actionType} [IP] ${ip}`);
  console.log(`${actionType} [USER-AGENT] ${userAgent}`);
  console.log(`${actionType} [REFERER] ${referer}`);
  console.log(`${actionType} [ORIGIN] ${origin}`);
  console.log(`${actionType} [QUERY PARAMS]`, JSON.stringify(req.query, null, 2));
  console.log(`${actionType} [BODY]`, JSON.stringify(req.body, null, 2));
  console.log(`${actionType} [HEADERS]`, JSON.stringify(req.headers, null, 2));
  
  // Log specific frontend actions
  if (isFrontendAction) {
    console.log(`🎯 [FRONTEND ACTION DETECTED]`);
    console.log(`🎯 [ACTION TYPE] ${method} ${path}`);
    console.log(`🎯 [FRONTEND SOURCE] ${referer}`);
    console.log(`🎯 [USER CONTEXT] IP: ${ip}, Origin: ${origin}`);
    
    // Log specific action details
    if (path.includes('posts')) {
      console.log(`🎯 [POST ACTION] User is interacting with posts`);
      if (method === 'GET') console.log(`🎯 [ACTION] User is viewing posts`);
      if (method === 'POST') console.log(`🎯 [ACTION] User is creating a post`);
    }
    if (path.includes('rooms')) {
      console.log(`🎯 [ROOM ACTION] User is interacting with rooms`);
      if (method === 'GET') console.log(`🎯 [ACTION] User is browsing rooms`);
    }
    if (path.includes('reactions')) {
      console.log(`🎯 [REACTION ACTION] User is reacting to content`);
      if (method === 'POST') console.log(`🎯 [ACTION] User added a reaction`);
      if (method === 'DELETE') console.log(`🎯 [ACTION] User removed a reaction`);
    }
    if (path.includes('users')) {
      console.log(`🎯 [USER ACTION] User is managing account`);
      if (method === 'POST') console.log(`🎯 [ACTION] User is registering/logging in`);
    }
  }
  
  console.log(`${actionType} ========================\n`);
  
  // Log response when it's sent
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - req.startTime;
    console.log(`${actionType} [RESPONSE] Status: ${res.statusCode}`);
    console.log(`${actionType} [RESPONSE TIME] ${responseTime}ms`);
    console.log(`${actionType} [RESPONSE DATA]`, JSON.stringify(data, null, 2));
    
    if (isFrontendAction) {
      console.log(`🎯 [FRONTEND RESPONSE] Action completed for user`);
      console.log(`🎯 [RESPONSE STATUS] ${res.statusCode === 200 ? 'SUCCESS' : 'ERROR'}`);
    }
    
    console.log(`${actionType} ===== END REQUEST =====\n`);
    return originalSend.call(this, data);
  };
  
  req.startTime = Date.now();
  next();
});

// Routes - Add /api prefix for frontend compatibility
app.use('/api/health', require('./src/routes/health'));
app.use('/api/token', require('./src/routes/token'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/posts', require('./src/routes/posts'));
app.use('/api/rooms', require('./src/routes/rooms'));
app.use('/api/reactions', require('./src/routes/reactions'));

// Also keep root routes for direct access
app.use('/health', require('./src/routes/health'));
app.use('/token', require('./src/routes/token'));
app.use('/users', require('./src/routes/users'));
app.use('/posts', require('./src/routes/posts'));
app.use('/rooms', require('./src/routes/rooms'));
app.use('/reactions', require('./src/routes/reactions'));

// Session stats endpoint for debugging
app.get('/api/debug/sessions', (req, res) => {
  const stats = getSessionStats();
  console.log(`📊 [DEBUG] Session stats requested via /api`);
  console.log(`📊 [DEBUG] Total sessions: ${stats.totalSessions}`);
  console.log(`📊 [DEBUG] Active sessions: ${stats.activeSessions}`);
  console.log(`📊 [DEBUG] Total actions: ${stats.totalActions}`);
  res.json(stats);
});

app.get('/debug/sessions', (req, res) => {
  const stats = getSessionStats();
  console.log(`📊 [DEBUG] Session stats requested via root`);
  console.log(`📊 [DEBUG] Total sessions: ${stats.totalSessions}`);
  console.log(`📊 [DEBUG] Active sessions: ${stats.activeSessions}`);
  console.log(`📊 [DEBUG] Total actions: ${stats.totalActions}`);
  res.json(stats);
});

async function bootstrap() {
  // Ensure DB connects (with retry) before running migrations and starting server
  await connectWithRetry();

  // Run pending migrations automatically
  const mongooseConnection = getMongooseConnection();
  await runMigrations(mongooseConnection);

  // Backfill: ensure all existing posts have an expiresAt 24h after createdAt
  try {
    const Post = require('./src/models/Post');
    const now = new Date();
    const result = await Post.updateMany(
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $exists: false } }
        ]
      },
      [
        {
          $set: {
            expiresAt: {
              $cond: [
                { $ifNull: [ '$createdAt', false ] },
                { $add: [ '$createdAt', 24 * 60 * 60 * 1000 ] },
                new Date(now.getTime() + 24 * 60 * 60 * 1000)
              ]
            },
            duration: '24h'
          }
        }
      ]
    );
    console.log(`🧹 [BACKFILL] expiresAt set for ${result.modifiedCount || result.nModified || 0} posts`);
  } catch (err) {
    console.log('⚠️  [BACKFILL] Skipped expiresAt backfill:', err.message);
  }

  // Start server
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});

module.exports = app;

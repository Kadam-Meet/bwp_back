// Session tracking middleware for frontend actions
const sessionStore = new Map();

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function trackUserSession(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  const userAgent = req.get('User-Agent') || 'Unknown';
  const sessionKey = `${ip}_${userAgent}`;
  
  // Get or create session
  let session = sessionStore.get(sessionKey);
  if (!session) {
    session = {
      id: generateSessionId(),
      ip: ip,
      userAgent: userAgent,
      firstSeen: new Date(),
      lastSeen: new Date(),
      actions: [],
      totalActions: 0
    };
    sessionStore.set(sessionKey, session);
    console.log(`👤 [NEW SESSION] Created session ${session.id} for IP ${ip}`);
  } else {
    session.lastSeen = new Date();
  }
  
  // Track this action
  const action = {
    timestamp: new Date(),
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    userAgent: userAgent
  };
  
  session.actions.push(action);
  session.totalActions++;
  
  // Keep only last 100 actions per session
  if (session.actions.length > 100) {
    session.actions = session.actions.slice(-100);
  }
  
  // Add session info to request
  req.session = session;
  req.sessionId = session.id;
  
  console.log(`👤 [SESSION] ${session.id} - Action #${session.totalActions}`);
  console.log(`👤 [SESSION] IP: ${ip}, Actions: ${session.totalActions}`);
  console.log(`👤 [SESSION] First seen: ${session.firstSeen}`);
  console.log(`👤 [SESSION] Last seen: ${session.lastSeen}`);
  
  next();
}

function getSessionStats() {
  const sessions = Array.from(sessionStore.values());
  return {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => 
      Date.now() - s.lastSeen.getTime() < 30 * 60 * 1000 // Active in last 30 minutes
    ).length,
    totalActions: sessions.reduce((sum, s) => sum + s.totalActions, 0),
    sessions: sessions.map(s => ({
      id: s.id,
      ip: s.ip,
      firstSeen: s.firstSeen,
      lastSeen: s.lastSeen,
      totalActions: s.totalActions,
      recentActions: s.actions.slice(-5) // Last 5 actions
    }))
  };
}

module.exports = {
  trackUserSession,
  getSessionStats,
  sessionStore
};

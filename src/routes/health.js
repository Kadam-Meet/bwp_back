const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (_req, res) => {
  console.log('🔵 [HEALTH] GET /health - Checking server and DB status');
  const dbState = mongoose.connection.readyState; // 1 connected, 2 connecting
  const healthy = dbState === 1;
  console.log('🟡 [HEALTH] DB state:', dbState, 'Healthy:', healthy);
  res.status(healthy ? 200 : 503).json({
    status: 'ok',
    db: healthy ? 'connected' : 'disconnected',
  });
});

module.exports = router;



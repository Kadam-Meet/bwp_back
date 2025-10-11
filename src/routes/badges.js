const express = require('express');
const { getUserBadges, checkAndAwardBadges } = require('../controllers/badgeController');

const router = express.Router();

router.get('/:userId', getUserBadges);
router.post('/:userId/check', checkAndAwardBadges);

module.exports = router;

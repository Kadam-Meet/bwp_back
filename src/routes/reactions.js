const express = require('express');
const { addReaction, removeReaction, getPostReactions } = require('../controllers/reactionController');

const router = express.Router();

router.post('/', addReaction);
router.delete('/', removeReaction);
router.get('/:postId', getPostReactions);

module.exports = router;

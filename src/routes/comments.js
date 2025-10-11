const express = require('express');
const { getPostComments, createComment, deleteComment } = require('../controllers/commentController');

const router = express.Router();

router.get('/:postId', getPostComments);
router.post('/', createComment);
router.delete('/:commentId', deleteComment);

module.exports = router;

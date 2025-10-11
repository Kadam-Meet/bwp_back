const express = require('express');
const { createPost, listPosts, deletePost } = require('../controllers/postController');

const router = express.Router();

router.post('/', createPost);
router.get('/', listPosts);
router.delete('/:id', deletePost);

module.exports = router;



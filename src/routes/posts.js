const express = require('express');
const { createPost, listPosts } = require('../controllers/postController');

const router = express.Router();

router.post('/', createPost);
router.get('/', listPosts);

module.exports = router;



const express = require('express');
const { createUser, listUsers, loginUser, createAnonymous } = require('../controllers/userController');

const router = express.Router();

router.post('/', createUser);
router.get('/', listUsers);
router.post('/login', loginUser);
router.post('/anonymous', createAnonymous);

module.exports = router;



const express = require('express');
const { createUser, listUsers, loginUser, createAnonymous, logoutUser, testEndpoint } = require('../controllers/userController');

const router = express.Router();

router.get('/test', testEndpoint);
router.post('/', createUser);
router.get('/', listUsers);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/anonymous', createAnonymous);

module.exports = router;



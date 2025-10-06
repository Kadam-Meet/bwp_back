const express = require('express');
const { createUser, listUsers } = require('../controllers/userController');

const router = express.Router();

router.post('/', createUser);
router.get('/', listUsers);

module.exports = router;



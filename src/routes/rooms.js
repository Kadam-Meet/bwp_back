const express = require('express');
const { listRooms, getRoom } = require('../controllers/roomController');

const router = express.Router();

router.get('/', listRooms);
router.get('/:id', getRoom);

module.exports = router;

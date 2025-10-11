const express = require('express');
const { listRooms, getRoom, createRoom } = require('../controllers/roomController');

const router = express.Router();

router.get('/', listRooms);
router.get('/:id', getRoom);
router.post('/', createRoom);

module.exports = router;

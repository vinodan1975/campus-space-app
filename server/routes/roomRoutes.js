const express = require('express');
const router = express.Router();
const { getRooms, searchRooms } = require('../controllers/roomController');

router.get('/', getRooms);
router.get('/search', searchRooms);

module.exports = router;

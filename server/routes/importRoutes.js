const express = require('express');
const router = express.Router();
const { importRooms, importUsers, downloadTemplate, exportRoomsExcel } = require('../controllers/importController');

router.post('/rooms', importRooms);
router.post('/users', importUsers);
router.get('/template/:type', downloadTemplate);
router.get('/export/rooms', exportRoomsExcel);

module.exports = router;

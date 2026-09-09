const express = require('express');
const router = express.Router();
const { createBooking, cancelBooking } = require('../controllers/bookingController');

router.post('/', createBooking);
router.delete('/:id', cancelBooking);

module.exports = router;

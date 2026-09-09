const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Only required if it's an occupied/reserved by faculty. Regular timetables might not have this if it's just 'Occupied' generally, but for this app it seems faculty makes the reservations.
  },
  subject: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Occupied', 'Reserved'],
    required: true,
  },
  isRoutine: {
    type: Boolean,
    default: false, // true for regular timetable, false for extra lectures/meetings
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);

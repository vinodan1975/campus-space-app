const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true, // e.g., 101, Lab 1
  },
  floor: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['Classroom', 'Computer Lab', 'Seminar Hall', 'Study Room'],
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  labType: {
    type: String, // Optional, e.g., 'Mac', 'Windows', 'Electronics'
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);

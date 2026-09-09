const Booking = require('../models/Booking');
const Room = require('../models/Room');

const createBooking = async (req, res) => {
  const { room, subject, startTime, endTime, status, faculty } = req.body;
  try {
    const newBooking = new Booking({
      room,
      subject,
      startTime,
      endTime,
      status: status || 'Reserved',
      faculty: faculty || undefined,
    });
    const savedBooking = await newBooking.save();

    // Populate faculty name for the event
    const populated = await Booking.findById(savedBooking._id).populate('faculty', 'name');
    const roomDoc = await Room.findById(room);

    // Emit real-time event to ALL connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('room_booked', {
        roomId: room,
        roomNumber: roomDoc ? roomDoc.roomNumber : 'a room',
        subject,
        faculty: populated.faculty ? populated.faculty.name : 'Faculty',
        status: status || 'Reserved',
        startTime,
        endTime,
      });
    }

    res.status(201).json(savedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const roomNumber = booking.room ? booking.room.roomNumber : 'a room';
    await Booking.findByIdAndDelete(req.params.id);

    // Emit real-time event that room is now available
    const io = req.app.get('io');
    if (io) {
      io.emit('room_cancelled', {
        roomId: booking.room._id,
        roomNumber,
      });
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, cancelBooking };

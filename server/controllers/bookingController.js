const Booking = require('../models/Booking');
const Room = require('../models/Room');

const createBooking = async (req, res) => {
  const { room, subject, startTime, endTime, status, faculty, department, year } = req.body;
  try {
    // ── Check 1: Room already booked at this time? ────────────────────────
    const roomConflict = await Booking.findOne({
      room,
      startTime: { $lt: new Date(endTime) },
      endTime:   { $gt: new Date(startTime) },
    }).populate('faculty', 'name');

    if (roomConflict) {
      const roomDoc = await Room.findById(room);
      const bookedBy = roomConflict.faculty ? roomConflict.faculty.name : 'another faculty';
      const start = new Date(roomConflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const end   = new Date(roomConflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return res.status(409).json({
        message: `Room "${roomDoc ? roomDoc.roomNumber : 'this room'}" is already booked by ${bookedBy} from ${start} to ${end}. Please choose a different time or room.`,
      });
    }

    // ── Check 2: Same faculty already booked another room at this time? ───
    if (faculty) {
      const facultyConflict = await Booking.findOne({
        faculty,
        startTime: { $lt: new Date(endTime) },
        endTime:   { $gt: new Date(startTime) },
      }).populate('room', 'roomNumber');

      if (facultyConflict) {
        const conflictRoom = facultyConflict.room ? facultyConflict.room.roomNumber : 'another room';
        const start = new Date(facultyConflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const end   = new Date(facultyConflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return res.status(409).json({
          message: `You already have a booking for "${conflictRoom}" from ${start} to ${end}. A faculty member can only be in one room at a time.`,
        });
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    const newBooking = new Booking({
      room,
      subject,
      department: department || undefined,
      year: year || undefined,
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
        floor: roomDoc ? roomDoc.floor : '',
        roomType: roomDoc ? roomDoc.type : 'Classroom',
        capacity: roomDoc ? roomDoc.capacity : null,
        subject,
        department: department || null,
        year: year || null,
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
        roomId: booking.room ? booking.room._id : null,
        roomNumber,
        floor: booking.room ? booking.room.floor : '',
      });
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, cancelBooking };

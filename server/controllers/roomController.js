const Room = require('../models/Room');
const Booking = require('../models/Booking');

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({});
    // Fetch bookings that have not ended yet
    const upcomingBookings = await Booking.find({
       endTime: { $gte: new Date() }
    }).populate('faculty', 'name').sort({ startTime: 1 });

    // Merge status
    const roomsWithStatus = rooms.map(room => {
       // Find the most relevant booking (either currently active, or next upcoming)
       const now = new Date();
       const booking = upcomingBookings.find(b => b.room.toString() === room._id.toString());
       
       if (booking) {
         let currentStatus = booking.status;
         // If it hasn't started yet, force it to 'Reserved' so people know
         if (new Date(booking.startTime) > now) {
           currentStatus = 'Reserved';
         }
         
         return {
           ...room._doc,
           status: currentStatus,
           faculty: booking.faculty ? booking.faculty.name : null,
           subject: booking.subject,
           department: booking.department || null,
           year: booking.year || null,
           startTime: booking.startTime,
           endTime: booking.endTime,
         };
       }

       return {
         ...room._doc,
         status: 'Available',
         faculty: null,
         subject: null,
         department: null,
         year: null,
         startTime: null,
         endTime: null,
       };
    });
    
    // Fallback mock data if DB is empty
    if (roomsWithStatus.length === 0) {
      return res.json([
        { _id: '1', roomNumber: '101', floor: 1, type: 'Classroom', capacity: 60, status: 'Available' },
        { _id: '2', roomNumber: '102', floor: 1, type: 'Classroom', capacity: 60, status: 'Occupied', faculty: 'Dr. Smith', subject: 'Data Structures', startTime: '10:00 AM', endTime: '11:00 AM' },
        { _id: '3', roomNumber: '201', floor: 2, type: 'Classroom', capacity: 40, status: 'Available' },
        { _id: '4', roomNumber: '202', floor: 2, type: 'Classroom', capacity: 40, status: 'Occupied', faculty: 'Prof. Johnson', subject: 'Operating Systems', startTime: '11:00 AM', endTime: '12:00 PM' },
        { _id: '5', roomNumber: 'Lab 1', floor: 3, type: 'Computer Lab', capacity: 30, status: 'Available' },
        { _id: '6', roomNumber: 'Lab 2', floor: 3, type: 'Computer Lab', capacity: 35, status: 'Reserved', faculty: 'Dr. Lee', subject: 'Web Dev Workshop', startTime: '2:00 PM', endTime: '4:00 PM' },
      ]);
    }

    res.json(roomsWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchRooms = async (req, res) => {
  const { roomNumber, floor, type, capacity, status } = req.query;
  const query = {};
  
  if (roomNumber) query.roomNumber = { $regex: roomNumber, $options: 'i' };
  if (floor) query.floor = Number(floor);
  if (type) query.type = type;
  if (capacity) query.capacity = { $gte: Number(capacity) };
  
  try {
    const rooms = await Room.find(query);
    const now = new Date();
    const upcomingBookings = await Booking.find({
      endTime: { $gte: now }
    }).populate('faculty', 'name').sort({ startTime: 1 });

    const results = rooms.map(room => {
      const booking = upcomingBookings.find(b => b.room.toString() === room._id.toString());
      if (booking) {
        let currentStatus = booking.status;
        if (new Date(booking.startTime) > now) {
          currentStatus = 'Reserved';
        }
        return {
          ...room._doc,
          status: currentStatus,
          faculty: booking.faculty ? booking.faculty.name : null,
          subject: booking.subject,
          department: booking.department || null,
          year: booking.year || null,
          startTime: booking.startTime,
          endTime: booking.endTime,
        };
      }
      return {
        ...room._doc,
        status: 'Available',
        faculty: null,
        subject: null,
        department: null,
        year: null,
        startTime: null,
        endTime: null,
      };
    });

    if (status) {
      return res.json(results.filter(r => r.status.toLowerCase() === status.toLowerCase()));
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRooms, searchRooms };
